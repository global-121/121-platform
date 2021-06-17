import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AuthService } from 'src/app/auth/auth.service';
import { UserRole } from 'src/app/auth/user-role.enum';
import { ExportType } from 'src/app/models/export-type.model';
import { Installment } from 'src/app/models/installment.model';
import {
  DistributionFrequency,
  Program,
  ProgramPhase,
} from 'src/app/models/program.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';

@Component({
  selector: 'app-program-payout',
  templateUrl: './program-payout.component.html',
  styleUrls: ['./program-payout.component.scss'],
})
export class ProgramPayoutComponent implements OnInit {
  @Input()
  public programId: number;

  @Output()
  isCompleted: EventEmitter<boolean> = new EventEmitter<boolean>();

  public enumExportType = ExportType;

  public program: Program;
  public installments: Installment[];

  public canMakePayment: boolean;
  public canMakeExport: boolean;

  public exportInstallmentId = 0;
  public exportInstallmentAvailable: boolean;

  public lastInstallmentId: number;
  public nextInstallmentId: number;
  private totalIncluded: number;

  constructor(
    private programsService: ProgramsServiceApiService,
    private authService: AuthService,
  ) {}

  async ngOnInit() {
    this.isCompleted.emit(false);

    this.program = await this.programsService.getProgramById(this.programId);

    this.canMakePayment = this.checkCanMakePayment();
    this.canMakeExport = this.checkCanMakeExport();

    this.totalIncluded = (
      await this.programsService.getTotalIncluded(this.programId)
    ).connections;

    await this.createInstallments();
    this.checkPhaseReady();
  }

  private checkCanMakePayment(): boolean {
    return (
      this.program.state === ProgramPhase.payment &&
      this.authService.hasUserRole([UserRole.RunProgram])
    );
  }

  private checkCanMakeExport(): boolean {
    return this.authService.hasUserRole([UserRole.PersonalData]);
  }

  private createTemplateInstallments(count: number): Installment[] {
    return Array(count)
      .fill(1)
      .map((_, index) => ({
        id: index + 1,
        installmentDate: new Date(),
        statusOpen: true,
        isExportAvailable: false,
      }));
  }

  private getInstallmentById(id: number): Installment {
    return this.installments.find((item) => item.id === id);
  }

  private fillInstallmentHistory(pastInstallments: Installment[]): void {
    pastInstallments.forEach((pastInstallment) => {
      const installment = this.getInstallmentById(pastInstallment.id);
      installment.installmentDate = pastInstallment.installmentDate;
      installment.statusOpen = false;
      installment.isExportAvailable = true;

      // Save updated values:
      this.installments[this.installments.indexOf(installment)] = installment;
    });
  }

  private setFutureDates(
    startDate: Date,
    frequency: DistributionFrequency,
  ): void {
    const maxInstallmentDate = new Date(startDate);

    this.installments = this.installments.map((installment) => {
      // Skip past-installments
      if (!installment.statusOpen) {
        return installment;
      }

      switch (frequency) {
        case DistributionFrequency.week:
          maxInstallmentDate.setDate(maxInstallmentDate.getDate() + 7);
          break;
        case DistributionFrequency.month:
        default:
          maxInstallmentDate.setMonth(maxInstallmentDate.getMonth() + 1);
          break;
      }

      installment.installmentDate = new Date(maxInstallmentDate);

      return installment;
    });
  }

  private async createInstallments() {
    this.installments = this.createTemplateInstallments(
      this.program.distributionDuration,
    );

    const pastInstallments = await this.programsService.getPastInstallments(
      this.programId,
    );
    this.lastInstallmentId = await this.programsService.getLastInstallmentId(
      this.programId,
      pastInstallments,
    );
    this.nextInstallmentId =
      this.lastInstallmentId < this.program.distributionDuration
        ? this.lastInstallmentId + 1
        : 0;

    this.fillInstallmentHistory(pastInstallments);

    let startDate = new Date();
    if (pastInstallments && pastInstallments.length > 1) {
      startDate = pastInstallments[pastInstallments.length - 1].installmentDate;
    }
    this.setFutureDates(startDate, this.program.distributionFrequency);

    this.setupNextPayment();
  }

  private setupNextPayment() {
    const nextPaymentIndex = this.installments.findIndex(
      (installment) => installment.statusOpen === true,
    );
    if (nextPaymentIndex > -1) {
      this.installments[nextPaymentIndex].isExportAvailable =
        this.totalIncluded > 0;
    }
  }

  public changeExportInstallment() {
    if (Number(this.exportInstallmentId) === 0) {
      this.exportInstallmentAvailable = false;
      return;
    }
    const installment = this.getInstallmentById(
      Number(this.exportInstallmentId),
    );
    this.exportInstallmentAvailable = installment.isExportAvailable;
  }

  async isIntersolve() {
    this.program = await this.programsService.getProgramById(this.programId);
    for (const fsp of this.program.financialServiceProviders) {
      if (fsp.fsp.toLowerCase().includes('intersolve')) {
        return true;
      }
    }
    return false;
  }

  private checkPhaseReady() {
    const isReady =
      this.program.state !== ProgramPhase.payment ||
      this.lastInstallmentId === this.program.distributionDuration;

    this.isCompleted.emit(isReady);
  }
}

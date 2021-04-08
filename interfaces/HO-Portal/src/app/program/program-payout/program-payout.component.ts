import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'src/app/auth/auth.service';
import { UserRole } from 'src/app/auth/user-role.enum';
import { ExportType } from 'src/app/models/export-type.model';
import { Installment } from 'src/app/models/installment.model';
import { Program, ProgramPhase } from 'src/app/models/program.model';
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

  public isEnabled = true;
  public isInProgress = false;

  public program: Program;
  public nrOfInstallments: number;
  public nrOfPastInstallments: number;
  public installments: Installment[];
  public totalIncluded: number;

  private activePhase: ProgramPhase;

  public canMakePayment: boolean;

  constructor(
    private programsService: ProgramsServiceApiService,
    private translate: TranslateService,
    private alertController: AlertController,
    private authService: AuthService,
  ) {}

  async ngOnInit() {
    this.isCompleted.emit(false);

    this.program = await this.programsService.getProgramById(this.programId);

    this.canMakePayment = this.checkCanMakePayment();

    this.createInstallments();
  }

  private checkCanMakePayment(): boolean {
    return (
      this.program.state === ProgramPhase.payment &&
      this.authService.hasUserRole([UserRole.RunProgram])
    );
  }

  private async createInstallments() {
    this.totalIncluded = await this.programsService.getTotalIncluded(
      this.programId,
    );
    this.activePhase = ProgramPhase[this.program.state];
    this.nrOfInstallments = this.program.distributionDuration;

    this.installments = Array(this.nrOfInstallments)
      .fill(1)
      .map((_, index) => ({
        id: index + 1,
        amount: 0,
        installmentDate: new Date(),
      }));

    const pastInstallments = await this.programsService.getPastInstallments(
      this.programId,
    );
    this.nrOfPastInstallments = pastInstallments.length;
    const pastInstallmentIds = pastInstallments.map((item) => item.id);

    let maxInstallmentDate: Date;
    this.installments.forEach((installment, index) => {
      if (pastInstallmentIds.includes(installment.id)) {
        const pastInstallment = pastInstallments.find(
          (item) => item.id === installment.id,
        );
        installment.amount = pastInstallment.amount;
        installment.installmentDate = pastInstallment.installmentDate;
        installment.statusOpen = false;
        installment.firstOpen = false;

        maxInstallmentDate = new Date(installment.installmentDate);
      } else {
        installment.amount = this.program.fixedTransferValue;
        installment.statusOpen = true;

        // Set dates
        if (index === 0) {
          installment.installmentDate = new Date();
        } else if (this.program.distributionFrequency === 'week') {
          installment.installmentDate = new Date(
            maxInstallmentDate.setDate(maxInstallmentDate.getDate() + 7),
          );
        } else {
          // For now do the same in all other cases then 'month'
          installment.installmentDate = new Date(
            maxInstallmentDate.setMonth(maxInstallmentDate.getMonth() + 1),
          );
        }
        maxInstallmentDate = new Date(installment.installmentDate);

        installment.firstOpen = this.isFirstOpen(index);
      }

      installment.isExportAvailable = this.isExportAvailable(installment);
    });

    this.checkPhaseReady();
  }

  private isFirstOpen(index: number) {
    const previousInstallment = this.installments[index - 1];
    return index === 0 || !previousInstallment.statusOpen;
  }

  public isExportAvailable(installment: Installment) {
    return (
      (installment.firstOpen && this.totalIncluded > 0) ||
      !installment.statusOpen
    );
  }

  private checkPhaseReady() {
    const isReady =
      this.activePhase !== ProgramPhase.payment ||
      this.nrOfPastInstallments === this.nrOfInstallments;

    this.isCompleted.emit(isReady);
  }
}

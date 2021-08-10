import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'src/app/auth/auth.service';
import { UserRole } from 'src/app/auth/user-role.enum';
import { ExportType } from 'src/app/models/export-type.model';
import { Installment, InstallmentData } from 'src/app/models/installment.model';
import {
  DistributionFrequency,
  Program,
  ProgramPhase,
} from 'src/app/models/program.model';
import { StatusEnum } from 'src/app/models/status.enum';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { PastPaymentsService } from '../../services/past-payments.service';

class LastPaymentResults {
  amount: number;
  error: number;
  success: number;
  waiting: number;
}

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

  private pastInstallments: InstallmentData[];
  public lastPaymentResults: LastPaymentResults;

  public lastInstallmentId: number;
  public nextInstallmentId: number;
  private totalIncluded: number;

  constructor(
    private programsService: ProgramsServiceApiService,
    private pastPaymentsService: PastPaymentsService,
    private authService: AuthService,
    private translate: TranslateService,
    private alertController: AlertController,
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
    this.lastPaymentResults = await this.getLastPaymentResults();
    this.checkPhaseReady();
  }

  private checkCanMakePayment(): boolean {
    return (
      this.program.phase === ProgramPhase.payment &&
      this.authService.hasUserRole([UserRole.RunProgram])
    );
  }

  private checkCanMakeExport(): boolean {
    return this.authService.hasUserRole([UserRole.PersonalData]);
  }

  private async getLastPaymentResults(): Promise<LastPaymentResults> {
    const installment = this.getInstallmentById(this.lastInstallmentId);
    const results = {
      amount: installment ? installment.amount : 0,
      error: 0,
      success: 0,
      waiting: 0,
    };

    const transactions = await this.programsService.getTransactions(
      this.programId,
      this.lastInstallmentId,
    );

    let installmentTransactions;
    if (transactions && transactions.length) {
      installmentTransactions = transactions.filter(
        (transaction) => transaction.installment === this.lastInstallmentId,
      );
    }

    if (!installmentTransactions || !installmentTransactions.length) {
      return results;
    }

    const taError = installmentTransactions.filter(
      (t) => t.status === StatusEnum.error,
    );
    const taDone = installmentTransactions.filter(
      (t) => t.status === StatusEnum.success,
    );
    const taWait = installmentTransactions.filter(
      (t) => t.status === StatusEnum.waiting,
    );

    return {
      amount: installment.amount,
      error: taError.length,
      success: taDone.length,
      waiting: taWait.length,
    };
  }

  private createTemplateInstallments(count: number): Installment[] {
    return Array(count)
      .fill(1)
      .map((_, index) => ({
        id: index + 1,
        installmentDate: new Date(),
        amount: this.program.fixedTransferValue,
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
      installment.amount = pastInstallment.amount;
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

    this.pastInstallments = await this.programsService.getPastInstallments(
      this.programId,
    );
    this.lastInstallmentId =
      await this.pastPaymentsService.getLastInstallmentId(
        this.programId,
        this.pastInstallments,
      );
    this.nextInstallmentId =
      this.lastInstallmentId < this.program.distributionDuration
        ? this.lastInstallmentId + 1
        : 0;

    this.fillInstallmentHistory(this.pastInstallments);

    let startDate = new Date();
    if (this.pastInstallments && this.pastInstallments.length > 1) {
      startDate =
        this.pastInstallments[this.pastInstallments.length - 1].installmentDate;
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

  public async retryLastPayment() {
    // this.isInProgress = true;
    await this.programsService
      .submitPayout(
        this.programId,
        this.lastInstallmentId,
        this.lastPaymentResults.amount,
        null,
      )
      .then(
        (response) => {
          // this.isInProgress = false;
          let message = '';

          if (response) {
            message += this.translate.instant(
              'page.program.program-payout.result',
              {
                nrPa: `<strong>${response}</strong>`,
              },
            );
          }
          this.actionResult(message, true);
        },
        (err) => {
          console.log('err: ', err);
          if (err && err.error && err.error.error) {
            this.actionResult(err.error.errors);
          }
          // this.isInProgress = false;
        },
      );
  }

  private async actionResult(resultMessage: string, refresh: boolean = false) {
    const alert = await this.alertController.create({
      backdropDismiss: false,
      message: resultMessage,
      buttons: [
        {
          text: this.translate.instant('common.ok'),
          handler: () => {
            alert.dismiss(true);
            if (refresh) {
              window.location.reload();
            }
            return false;
          },
        },
      ],
    });
    await alert.present();
  }

  private checkPhaseReady() {
    const isReady =
      this.program.phase !== ProgramPhase.payment ||
      this.lastInstallmentId === this.program.distributionDuration;

    this.isCompleted.emit(isReady);
  }
}

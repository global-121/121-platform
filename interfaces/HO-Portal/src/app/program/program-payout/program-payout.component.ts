import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'src/app/auth/auth.service';
import { UserRole } from 'src/app/auth/user-role.enum';
import { ExportType } from 'src/app/models/export-type.model';
import { Payment, PaymentData } from 'src/app/models/payment.model';
import {
  DistributionFrequency,
  Program,
  ProgramPhase,
} from 'src/app/models/program.model';
import { StatusEnum } from 'src/app/models/status.enum';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { FspIntegrationType } from '../../models/fsp.model';
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
  public payments: Payment[];
  public isIntersolve: boolean;

  public canMakePayment: boolean;
  public canMakeExport: boolean;

  public exportPaymentId = 0;
  public exportPaymentAvailable: boolean;

  private pastPayments: PaymentData[];
  public lastPaymentResults: LastPaymentResults;

  public lastPaymentId: number;
  public nextPaymentId: number;
  private totalIncluded: number;
  public minPayment: number;
  public maxPayment: number;

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
    this.isIntersolve = await this.checkIntersolve(this.program);

    this.canMakePayment = this.checkCanMakePayment();
    this.canMakeExport = this.checkCanMakeExport();

    this.totalIncluded = (
      await this.programsService.getTotalIncluded(this.programId)
    ).registrations;

    await this.createPayments();
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
    const payment = this.getPaymentById(this.lastPaymentId);
    const results = {
      amount: payment ? payment.amount : 0,
      error: 0,
      success: 0,
      waiting: 0,
    };

    const transactions = await this.programsService.getTransactions(
      this.programId,
      this.lastPaymentId,
    );

    let paymentTransactions;
    if (transactions && transactions.length) {
      paymentTransactions = transactions.filter(
        (transaction) => transaction.payment === this.lastPaymentId,
      );
    }

    if (!paymentTransactions || !paymentTransactions.length) {
      return results;
    }

    const taError = paymentTransactions.filter(
      (t) => t.status === StatusEnum.error,
    );
    const taDone = paymentTransactions.filter(
      (t) => t.status === StatusEnum.success,
    );
    const taWait = paymentTransactions.filter(
      (t) => t.status === StatusEnum.waiting,
    );

    return {
      amount: payment.amount,
      error: taError.length,
      success: taDone.length,
      waiting: taWait.length,
    };
  }

  private createTemplatePayments(count: number): Payment[] {
    return Array(count)
      .fill(1)
      .map((_, index) => ({
        id: index + 1,
        paymentDate: new Date(),
        amount: this.program.fixedTransferValue,
        statusOpen: true,
        isExportAvailable: false,
      }));
  }

  private getPaymentById(id: number): Payment {
    return this.payments.find((item) => item.id === id);
  }

  private fillPaymentHistory(pastPayments: Payment[]): void {
    pastPayments.forEach((pastPayment) => {
      const payment = this.getPaymentById(pastPayment.id);
      payment.amount = pastPayment.amount;
      payment.paymentDate = pastPayment.paymentDate;
      payment.statusOpen = false;
      payment.isExportAvailable = true;

      // Save updated values:
      this.payments[this.payments.indexOf(payment)] = payment;
    });
  }

  private setFutureDates(
    startDate: Date,
    frequency: DistributionFrequency,
  ): void {
    const maxPaymentDate = new Date(startDate);

    this.payments = this.payments.map((payment) => {
      // Skip past-payments
      if (!payment.statusOpen) {
        return payment;
      }

      switch (frequency) {
        case DistributionFrequency.week:
          maxPaymentDate.setDate(maxPaymentDate.getDate() + 7);
          break;
        case DistributionFrequency.month:
        default:
          maxPaymentDate.setMonth(maxPaymentDate.getMonth() + 1);
          break;
      }

      payment.paymentDate = new Date(maxPaymentDate);

      return payment;
    });
  }

  private async createPayments() {
    this.payments = this.createTemplatePayments(
      this.program.distributionDuration,
    );

    this.pastPayments = await this.programsService.getPastPayments(
      this.programId,
    );
    this.lastPaymentId = await this.pastPaymentsService.getLastPaymentId(
      this.programId,
      this.pastPayments,
    );
    this.nextPaymentId =
      this.lastPaymentId < this.program.distributionDuration
        ? this.lastPaymentId + 1
        : 0;

    this.fillPaymentHistory(this.pastPayments);

    let startDate = new Date();
    if (this.pastPayments && this.pastPayments.length > 1) {
      startDate = this.pastPayments[this.pastPayments.length - 1].paymentDate;
    }
    this.setFutureDates(startDate, this.program.distributionFrequency);

    this.setupNextPayment();
  }

  private setupNextPayment() {
    const nextPaymentIndex = this.payments.findIndex(
      (payment) => payment.statusOpen === true,
    );
    if (nextPaymentIndex > -1) {
      this.payments[nextPaymentIndex].isExportAvailable =
        this.totalIncluded > 0;
    }
  }

  public changeExportPayment() {
    if (Number(this.exportPaymentId) === 0) {
      this.exportPaymentAvailable = false;
      return;
    } else {
      this.exportPaymentAvailable = true;
    }
    if (Number(this.exportPaymentId) < 0) {
      this.minPayment = 1;
      this.maxPayment = this.lastPaymentId;
    } else if (this.exportPaymentId > 0) {
      this.minPayment = this.exportPaymentId;
      this.maxPayment = this.exportPaymentId;
    }
  }

  private async checkIntersolve(program: Program): Promise<boolean> {
    for (const fsp of program.financialServiceProviders) {
      if (fsp.fsp.toLowerCase().includes('intersolve')) {
        return true;
      }
    }
    return false;
  }

  async hasFspWithCsvIntegration() {
    this.program = await this.programsService.getProgramById(this.programId);
    for (const fsp of this.program.financialServiceProviders) {
      if (fsp.integrationType === FspIntegrationType.api) {
        return true;
      }
    }
    return false;
  }

  public async retryLastPayment() {
    await this.programsService
      .submitPayout(
        this.programId,
        this.lastPaymentId,
        this.lastPaymentResults.amount,
        null,
      )
      .then(
        (response) => {
          let message = '';

          if (response) {
            message += this.translate.instant(
              'page.program.program-payout.result.api', // Hard-coded set to 'api' instead of 'csv' becuse retry cannot happen for 'csv'
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
      this.lastPaymentId === this.program.distributionDuration;

    this.isCompleted.emit(isReady);
  }
}

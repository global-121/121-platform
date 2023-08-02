import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'src/app/auth/auth.service';
import Permission from 'src/app/auth/permission.enum';
import { DateFormat } from 'src/app/enums/date-format.enum';
import { ExportType } from 'src/app/models/export-type.model';
import {
  LastPaymentResults,
  Payment,
  PaymentData,
} from 'src/app/models/payment.model';
import {
  DistributionFrequency,
  Program,
  ProgramPhase,
} from 'src/app/models/program.model';
import { StatusEnum } from 'src/app/models/status.enum';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { FspIntegrationType } from '../../models/fsp.model';
import { PastPaymentsService } from '../../services/past-payments.service';
import { actionResult } from '../../shared/action-result';

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

  public DateFormat = DateFormat;
  public enumExportType = ExportType;
  public exportPaymentType: ExportType = ExportType.payment;
  public exportCardUsageType: ExportType = ExportType.cardBalances;

  public program: Program;
  public payments: Payment[];
  public programHasVoucherSupport: boolean;
  public hasFspWithExportFileIntegration: boolean;
  public hasFspWithReconciliation: boolean;
  public fspIdsWithReconciliation: number[];
  public canMakeFspInstructions: boolean;

  public canMakePayment: boolean;
  public canMakeExport: boolean;

  public exportPaymentId = 0;
  public exportPaymentAvailable: boolean;

  private fspsWithPhysicalCard = ['Intersolve-visa'];
  public canExportCardBalances: boolean;

  private pastPayments: PaymentData[];
  public lastPaymentResults: LastPaymentResults;

  public lastPaymentId: number;
  public nextPaymentId: number;
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

    this.programHasVoucherSupport = this.checkProgramHasVoucherSupport(
      this.program.financialServiceProviders,
    );
    this.hasFspWithExportFileIntegration = this.checkFspIntegrationType(
      this.program.financialServiceProviders,
      [FspIntegrationType.csv, FspIntegrationType.xml],
    );
    this.hasFspWithReconciliation = this.checkFspIntegrationType(
      this.program.financialServiceProviders,
      [FspIntegrationType.xml],
    );
    this.fspIdsWithReconciliation = this.program.financialServiceProviders
      .filter((fsp) => fsp.integrationType === FspIntegrationType.xml)
      .map((fsp) => fsp.id);
    this.canMakePayment = this.checkCanMakePayment();
    this.canMakeExport = this.checkCanMakeExport();

    if (!this.canMakeExport && !this.canMakePayment) {
      return;
    }
    this.canMakeFspInstructions = this.checkCanMakeFspInstructions();

    await this.createPayments();
    this.lastPaymentResults = await this.getLastPaymentResults();
    this.checkPhaseReady();

    this.canExportCardBalances = this.checkCanExportCardBalances();
  }

  private checkCanMakePayment(): boolean {
    return (
      this.program.phase === ProgramPhase.payment &&
      this.authService.hasAllPermissions(this.program.id, [
        Permission.PaymentREAD,
        Permission.PaymentCREATE,
        Permission.PaymentTransactionREAD,
      ])
    );
  }

  private checkCanMakeExport(): boolean {
    return this.authService.hasAllPermissions(this.program.id, [
      Permission.RegistrationPersonalEXPORT,
      Permission.PaymentREAD,
      Permission.PaymentTransactionREAD,
    ]);
  }

  private checkCanExportCardBalances(): boolean {
    const visaFsp = this.program?.financialServiceProviders?.some((fsp) =>
      this.fspsWithPhysicalCard.includes(fsp.fsp),
    );

    const hasPermission = this.authService.hasAllPermissions(this.program.id, [
      Permission.FspDebitCardEXPORT,
    ]);

    return visaFsp && hasPermission;
  }

  private checkCanMakeFspInstructions(): boolean {
    return this.authService.hasPermission(
      this.program.id,
      Permission.PaymentFspInstructionREAD,
    );
  }

  private async getLastPaymentResults(): Promise<LastPaymentResults> {
    const results = {
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
        case DistributionFrequency.weeks2:
          maxPaymentDate.setDate(maxPaymentDate.getDate() + 14);
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
    this.nextPaymentId = await this.pastPaymentsService.getNextPaymentId(
      this.program,
    );

    this.fillPaymentHistory(this.pastPayments);

    let startDate = new Date();
    if (this.pastPayments && this.pastPayments.length > 1) {
      startDate = this.pastPayments[this.pastPayments.length - 1].paymentDate;
    }
    this.setFutureDates(startDate, this.program.distributionFrequency);

    this.setupNextPayment();
  }

  private async setupNextPayment() {
    const nextPaymentIndex = this.payments.findIndex(
      (payment) => payment.statusOpen === true,
    );
    if (nextPaymentIndex > -1) {
      this.payments[nextPaymentIndex].isExportAvailable = true;
    }
  }

  public changeExportPayment() {
    this.updateExportType();
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

  private updateExportType() {
    if (Number(this.exportPaymentId) === this.nextPaymentId) {
      this.exportPaymentType = ExportType.included;
    } else {
      this.exportPaymentType = ExportType.payment;
    }
  }

  private checkProgramHasVoucherSupport(
    fsps: Program['financialServiceProviders'],
  ): boolean {
    const voucherFsps = [
      'Intersolve-voucher-paper',
      'Intersolve-voucher-whatsapp',
    ];
    for (const fsp of fsps || []) {
      if (fsp && voucherFsps.includes(fsp.fsp)) {
        return true;
      }
    }
    return false;
  }

  private checkFspIntegrationType(
    fsps: Program['financialServiceProviders'],
    integrationTypes: FspIntegrationType[],
  ): boolean {
    for (const fsp of fsps || []) {
      if (fsp && integrationTypes.includes(fsp.integrationType)) {
        return true;
      }
    }
    return false;
  }

  public async retryLastPayment() {
    await this.programsService
      .patchPayout(this.programId, this.lastPaymentId, null)
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
          actionResult(this.alertController, this.translate, message, true);
        },
        (err) => {
          console.log('err: ', err);
          if (err && err.error && err.error.error) {
            actionResult(
              this.alertController,
              this.translate,
              err.error.errors,
            );
          }
        },
      );
  }

  private checkPhaseReady() {
    const isReady =
      this.program.phase !== ProgramPhase.payment ||
      this.lastPaymentId === this.program.distributionDuration;

    this.isCompleted.emit(isReady);
  }
}

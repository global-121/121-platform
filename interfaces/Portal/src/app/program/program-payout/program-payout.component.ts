import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
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
import { DistributionFrequency, Program } from 'src/app/models/program.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { PaymentUtils } from 'src/app/shared/payment.utils';
import { FspIntegrationType } from '../../models/fsp.model';
import { PastPaymentsService } from '../../services/past-payments.service';
import { actionResult } from '../../shared/action-result';

const MAX_NUMBER_OF_PAYMENTS_TO_EXPORT = 7;

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
  public canMakeFspInstructions: boolean;
  public canImportFspReconciliation: boolean;

  public canViewPayment: boolean;
  public canMakePayment: boolean;
  public canMakeExport: boolean;

  public exportPaymentId = 0;
  public exportPaymentAvailable: boolean;

  public canExportCardBalances: boolean;

  private pastPayments: PaymentData[];
  public lastPaymentResults: LastPaymentResults;

  public lastPaymentId: number;
  public nextPaymentId: number;
  public minPayment: number;
  public maxPayment: number;
  public paymentInProgress = false;

  public showCbeValidationButton: boolean;

  public maxNumberOfPayment = MAX_NUMBER_OF_PAYMENTS_TO_EXPORT;

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
    this.hasFspWithExportFileIntegration =
      this.program.financialServiceProviders.some((fsp) =>
        [FspIntegrationType.csv, FspIntegrationType.xml].includes(
          fsp.integrationType,
        ),
      );
    this.hasFspWithReconciliation = this.program.financialServiceProviders.some(
      (fsp) => fsp.hasReconciliation,
    );

    this.canMakePayment = this.checkCanMakePayment();
    this.canViewPayment = this.checkCanViewPayment();
    this.canMakeExport = this.checkCanMakeExport();

    if (!this.canViewPayment && !this.canMakeExport && !this.canMakePayment) {
      return;
    }
    this.canMakeFspInstructions = await this.checkCanMakeFspInstructions();
    this.canImportFspReconciliation = this.checkCanImportFspReconciliation();

    await this.createPayments();
    this.lastPaymentResults = await this.getLastPaymentResults();
    this.getPaymentInProgress();

    this.canExportCardBalances = this.checkCanExportCardBalances();

    this.showCbeValidationButton = await this.checkShowCbeValidation();
  }

  private async getPaymentInProgress(): Promise<void> {
    const programPaymentsStatus =
      await this.programsService.getProgramPaymentsStatus(this.programId);
    this.paymentInProgress = programPaymentsStatus.inProgress;
  }

  private checkCanViewPayment(): boolean {
    return this.authService.hasAllPermissions(this.program.id, [
      Permission.PaymentREAD,
      Permission.PaymentTransactionREAD,
    ]);
  }

  private checkCanMakePayment(): boolean {
    return this.authService.hasAllPermissions(this.program.id, [
      Permission.PaymentREAD,
      Permission.PaymentCREATE,
      Permission.PaymentTransactionREAD,
    ]);
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
      PaymentUtils.hasPhysicalCardSupport(fsp.fsp),
    );

    const hasPermission = this.authService.hasAllPermissions(this.program.id, [
      Permission.FspDebitCardEXPORT,
    ]);

    return visaFsp && hasPermission;
  }

  private async checkCanMakeFspInstructions(): Promise<boolean> {
    return await this.authService.hasPermission(
      this.program.id,
      Permission.PaymentFspInstructionREAD,
    );
  }

  private checkCanImportFspReconciliation(): boolean {
    return this.authService.hasAllPermissions(this.program.id, [
      Permission.PaymentCREATE,
      Permission.PaymentREAD,
      Permission.PaymentTransactionREAD,
    ]);
  }

  async checkShowCbeValidation(): Promise<boolean> {
    const hasCbeProvider = this.program?.financialServiceProviders?.some(
      (fsp) => fsp.fsp === FinancialServiceProviderName.commercialBankEthiopia,
    );
    const hasPermission = await this.authService.hasPermission(
      this.program.id,
      Permission.PaymentFspInstructionREAD,
    );
    return hasCbeProvider && hasPermission;
  }

  private async getLastPaymentResults(): Promise<LastPaymentResults> {
    const paymentSummary = await this.programsService.getPaymentSummary(
      this.programId,
      this.lastPaymentId,
    );

    return {
      error: paymentSummary?.nrError || 0,
      success: paymentSummary?.nrSuccess || 0,
      waiting: paymentSummary?.nrWaiting || 0,
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
      if (!payment) {
        return;
      }
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
      this.minPayment =
        this.lastPaymentId > MAX_NUMBER_OF_PAYMENTS_TO_EXPORT
          ? this.lastPaymentId - MAX_NUMBER_OF_PAYMENTS_TO_EXPORT
          : 1;
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
    for (const fsp of fsps || []) {
      if (fsp && PaymentUtils.hasVoucherSupport(fsp.fsp)) {
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
              'page.program.program-payout.result.api', // Hard-coded set to 'api' instead of 'csv/xml' becuse retry only possible for 'api'
              {
                nrPa: `<strong>${response.applicableCount}</strong>`,
              },
            );
          }
          actionResult(this.alertController, this.translate, message, true);
        },
        (err) => {
          console.log('err: ', err);
          if (err && err.error && err.error.errors) {
            actionResult(
              this.alertController,
              this.translate,
              err.error.errors,
            );
          }
        },
      );
  }

  public refresh() {
    window.location.reload();
  }
}

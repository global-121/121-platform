import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DateFormat } from 'src/app/enums/date-format.enum';
import StatusDate from 'src/app/enums/status-dates.enum';
import {
  PaymentRowDetail,
  PayoutDetails,
  SinglePayoutDetails,
} from 'src/app/models/payment.model';
import { Program } from 'src/app/models/program.model';
import { StatusEnum } from 'src/app/models/status.enum';
import { Transaction } from 'src/app/models/transaction.model';
import { PaymentHistoryAccordionComponent } from 'src/app/program/payment-history-accordion/payment-history-accordion.component';
import { PaymentStatusPopupComponent } from 'src/app/program/payment-status-popup/payment-status-popup.component';
import { PastPaymentsService } from 'src/app/services/past-payments.service';
import { PaymentUtils } from 'src/app/shared/payment.utils';
import { FspName } from '../../../../../../services/121-service/src/fsp/enum/fsp-name.enum';
import { AuthService } from '../../auth/auth.service';
import Permission from '../../auth/permission.enum';
import { Person } from '../../models/person.model';
import { ProgramsServiceApiService } from '../../services/programs-service-api.service';
class ActivityOverviewItem {
  type: string;
  label?: string;
  date: Date;
  paymentRowDetail?: PaymentRowDetail;
  description?: string;
  hasVoucherSupport?: boolean;
  person?: Person;
  program?: Program;
  hasError?: boolean;
  hasWaiting?: boolean;
}

enum ActivityOverviewType {
  dataChanges = 'dataChanges',
  payment = 'payment',
  message = 'message',
  status = 'status',
}

@Component({
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    TranslateModule,
    PaymentHistoryAccordionComponent,
  ],
  selector: 'app-registration-activity-overview',
  templateUrl: './registration-activity-overview.component.html',
  styleUrls: ['./registration-activity-overview.component.scss'],
})
export class RegistrationActivityOverviewComponent implements OnInit {
  @Input()
  private program: Program;

  @Input()
  private person: Person;

  @Input()
  private referenceId: string;

  @Input()
  private canViewVouchers = false;

  public DateFormat = DateFormat;
  public firstPaymentToShow = 1;
  public activityOverview: ActivityOverviewItem[];
  public activityOverviewFilter: string = null;
  public activityOverviewButtons = [
    null,
    ActivityOverviewType.dataChanges,
    ActivityOverviewType.payment,
    ActivityOverviewType.message,
    ActivityOverviewType.status,
  ];

  private canViewPersonalData: boolean;
  private canViewMessageHistory: boolean;
  private canViewPaymentData: boolean;
  private canDoSinglePayment: boolean;
  private lastPaymentId: number;
  private pastTransactions: Transaction[] = [];

  constructor(
    private programsService: ProgramsServiceApiService,
    private translate: TranslateService,
    private authService: AuthService,
    private pastPaymentsService: PastPaymentsService,
    private modalController: ModalController,
  ) {}

  async ngOnInit() {
    if (!this.person || !this.program.id || !this.referenceId) {
      return;
    }

    this.loadPermissions();
    this.canDoSinglePayment = this.authService.hasAllPermissions(
      this.program.id,
      [
        Permission.ActionREAD,
        Permission.PaymentCREATE,
        Permission.PaymentREAD,
        Permission.PaymentTransactionREAD,
      ],
    );
    if (this.canViewPaymentData) {
      this.lastPaymentId = await this.pastPaymentsService.getLastPaymentId(
        this.program.id,
      );
      this.pastTransactions = await this.programsService.getTransactions(
        this.program.id,
        this.firstPaymentToShow,
        this.person?.referenceId,
      );
    }
    this.fillActivityOverview();
    this.activityOverview.reverse();
  }

  public getFilteredActivityOverview(): ActivityOverviewItem[] {
    if (!this.activityOverviewFilter) {
      return this.activityOverview;
    }
    return this.activityOverview.filter(
      (item) => item.type === this.activityOverviewFilter,
    );
  }

  public getFilterCount(filter: string | null): number {
    if (!this.activityOverview) {
      return 0;
    }
    if (!filter) {
      return this.activityOverview.length;
    }
    return this.activityOverview.filter((item) => item.type === filter).length;
  }

  public hasError(paymentRow: PaymentRowDetail): boolean {
    return PaymentUtils.hasError(paymentRow);
  }

  public hasWaiting(paymentRow: PaymentRowDetail): boolean {
    return PaymentUtils.hasWaiting(paymentRow);
  }

  public hasVoucherSupport(fsp: string): boolean {
    return PaymentUtils.hasVoucherSupport(fsp as FspName);
  }

  public enableSinglePayment(paymentRow: PaymentRowDetail): boolean {
    return PaymentUtils.enableSinglePayment(
      paymentRow,
      this.canDoSinglePayment,
      this.person,
      this.lastPaymentId,
      false,
    );
  }

  public async rowClick(paymentRow: PaymentRowDetail) {
    let voucherUrl = null;
    let voucherButtons = null;
    let showRetryButton = false;
    let doSinglePaymentDetails: SinglePayoutDetails = null;
    let paymentDetails: PayoutDetails = null;
    const hasWaiting = PaymentUtils.hasWaiting(paymentRow);
    const hasError = PaymentUtils.hasError(paymentRow);
    const isSinglePayment = PaymentUtils.enableSinglePayment(
      paymentRow,
      this.canDoSinglePayment,
      this.person,
      this.lastPaymentId,
      false,
    );

    if (
      !PaymentUtils.hasVoucherSupport(paymentRow.fsp) &&
      !hasError &&
      !isSinglePayment
    ) {
      return;
    }

    const content = hasWaiting
      ? paymentRow.errorMessage
      : hasError
      ? this.translate.instant(
          'page.program.program-people-affected.payment-status-popup.error-message',
        ) +
        ': <strong>' +
        paymentRow.errorMessage +
        '</strong><br><br>' +
        this.translate.instant(
          'page.program.program-people-affected.payment-status-popup.fix-error',
        )
      : isSinglePayment
      ? this.translate.instant(
          'page.program.program-people-affected.payment-status-popup.single-payment.intro',
        )
      : null;

    if (
      this.canViewVouchers &&
      PaymentUtils.hasVoucherSupport(this.person.fsp as FspName) &&
      !!paymentRow.transaction
    ) {
      await this.programsService
        .exportVoucher(
          this.person.referenceId,
          paymentRow.paymentIndex,
          this.program.id,
        )
        .then(
          async (voucherBlob) => {
            voucherUrl = window.URL.createObjectURL(voucherBlob);
            voucherButtons = true;
          },
          (error) => {
            console.log('error: ', error);
            voucherButtons = false;
          },
        );
    }
    if (hasError || paymentRow.hasMessageIcon || paymentRow.hasMoneyIconTable) {
      paymentDetails = {
        programId: this.program.id,
        payment: paymentRow.paymentIndex,
        amount: paymentRow.transaction.amount,
        referenceId: this.person.referenceId,
        paNr: this.person.id,
        currency: this.program.currency,
      };
    }
    if (this.canDoSinglePayment) {
      showRetryButton = !hasWaiting && hasError;
      doSinglePaymentDetails = {
        paNr: this.person.registrationProgramId,
        amount: this.program.fixedTransferValue,
        currency: this.program.currency,
        multiplier: this.person.paymentAmountMultiplier
          ? this.person.paymentAmountMultiplier
          : 1,
        programId: this.program.id,
        payment: paymentRow.paymentIndex,
        referenceId: this.person.referenceId,
      };
    }
    const titleError = hasError
      ? `${paymentRow.paymentIndex}: ${paymentRow.text}`
      : null;
    const titleMessageIcon = paymentRow.hasMessageIcon
      ? `${paymentRow.paymentIndex}: `
      : null;
    const titleMoneyIcon = paymentRow.hasMoneyIconTable
      ? `${paymentRow.paymentIndex}: `
      : null;
    const titleSinglePayment = isSinglePayment ? paymentRow.text : null;

    const modal: HTMLIonModalElement = await this.modalController.create({
      component: PaymentStatusPopupComponent,
      componentProps: {
        titleMessageIcon,
        titleMoneyIcon,
        titleError,
        titleSinglePayment,
        content,
        showRetryButton,
        payoutDetails: paymentDetails,
        singlePayoutDetails: doSinglePaymentDetails,
        voucherButtons,
        imageUrl: voucherUrl,
      },
    });
    modal.onDidDismiss().then(() => {
      // Remove the image from browser memory
      if (voucherUrl) {
        window.URL.revokeObjectURL(voucherUrl);
      }
    });
    await modal.present();
  }

  private fillPaymentRows(): PaymentRowDetail[] {
    const paymentRows = [];
    const nrOfPayments = this.program?.distributionDuration;
    const lastPaymentToShow = Math.min(this.lastPaymentId, nrOfPayments);

    for (
      let index = this.firstPaymentToShow;
      index <= lastPaymentToShow;
      index++
    ) {
      const transaction = PaymentUtils.getTransactionOfPaymentForRegistration(
        index,
        this.person.referenceId,
        this.pastTransactions,
      );
      let paymentRowValue: PaymentRowDetail = {
        paymentIndex: index,
        text: '',
      };
      if (!transaction) {
        paymentRowValue.text = this.translate.instant(
          'page.program.program-people-affected.transaction.do-single-payment',
        );
      } else {
        paymentRowValue = PaymentUtils.getPaymentRowInfo(
          transaction,
          this.program,
          index,
        );
        if (transaction.status === StatusEnum.success) {
        } else if (transaction.status === StatusEnum.waiting) {
          paymentRowValue.errorMessage = this.translate.instant(
            'page.program.program-people-affected.transaction.waiting-message',
          );
          paymentRowValue.waiting = true;
        } else {
          paymentRowValue.errorMessage = transaction.errorMessage;
        }

        paymentRowValue.status = transaction.status;
      }
      if (
        paymentRowValue.transaction ||
        PaymentUtils.enableSinglePayment(
          paymentRowValue,
          this.canDoSinglePayment,
          this.person,
          this.lastPaymentId,
          false,
        )
      ) {
        paymentRows.push(paymentRowValue);
      }
    }
    return paymentRows;
  }

  private async fillActivityOverview() {
    this.activityOverview = [];
    if (this.canViewPaymentData) {
      const tempData: ActivityOverviewItem[] = [];
      this.fillPaymentRows().forEach((v) => {
        tempData.push({
          paymentRowDetail: { ...v },
          type: ActivityOverviewType.payment,
          date: new Date(v.sentDate),
        });
      });
      this.activityOverview = [...tempData];
      this.activityOverview.reverse();
    }

    if (this.canViewMessageHistory) {
      const messageHistory = await this.programsService.retrieveMsgHistory(
        this.program.id,
        this.referenceId,
      );

      for (const message of messageHistory) {
        this.activityOverview.push({
          type: ActivityOverviewType.message,
          label: this.translate.instant(
            'registration-details.activity-overview.activities.message.label',
          ),
          date: new Date(message.created),
          description: message.body,
        });
      }
    }

    if (this.canViewPersonalData) {
      const changes =
        await this.programsService.getRegistrationChangeLogByReferenceId(
          this.program.id,
          this.person.referenceId,
        );

      for (const statusChange of this.getStatusChanges()) {
        this.activityOverview.push({
          type: ActivityOverviewType.status,
          label: this.translate.instant(
            'registration-details.activity-overview.activities.status.label',
          ),
          date: statusChange.date,
          description: this.translate.instant(
            'registration-details.activity-overview.activities.status.description',
            {
              status: this.translate.instant(
                'page.program.program-people-affected.status.' +
                  statusChange.status,
              ),
            },
          ),
        });
      }

      for (const change of changes) {
        this.activityOverview.push({
          type: ActivityOverviewType.dataChanges,
          label: this.translate.instant(
            'registration-details.activity-overview.activities.data-changes.label',
            { fieldName: change.fieldName },
          ),
          date: new Date(change.created),
          description: this.translate.instant(
            'registration-details.activity-overview.activities.data-changes.description',
            {
              oldValue: change.oldValue,
              newValue: change.newValue,
              reason: change.reason,
            },
          ),
        });
      }
    }

    this.activityOverview.sort((a, b) => (b.date > a.date ? 1 : -1));
  }

  public getIconName(type: ActivityOverviewType): string {
    const map = {
      [ActivityOverviewType.message]: 'mail-outline',
      [ActivityOverviewType.dataChanges]: 'pencil-outline',
      [ActivityOverviewType.payment]: 'cash-outline',
      [ActivityOverviewType.status]: 'reload-circle-outline',
    };
    return map[type];
  }

  private getStatusChanges(): { status: string; date: Date }[] {
    const statusChanges = [];
    for (const status of Object.keys(StatusDate)) {
      const statusChangeDateValue = this.person[StatusDate[status]];
      if (statusChangeDateValue) {
        statusChanges.push({
          status,
          date: new Date(statusChangeDateValue),
        });
      }
    }

    return statusChanges;
  }

  private loadPermissions() {
    this.canViewPersonalData = this.authService.hasAllPermissions(
      this.program.id,
      [Permission.RegistrationPersonalREAD],
    );
    this.canViewMessageHistory = this.authService.hasAllPermissions(
      this.program.id,
      [Permission.RegistrationNotificationREAD],
    );
    this.canViewPaymentData = this.authService.hasAllPermissions(
      this.program.id,
      [Permission.PaymentREAD, Permission.PaymentTransactionREAD],
    );
    this.canDoSinglePayment = this.authService.hasAllPermissions(
      this.program.id,
      [
        Permission.ActionREAD,
        Permission.PaymentCREATE,
        Permission.PaymentREAD,
        Permission.PaymentTransactionREAD,
      ],
    );
    this.canViewVouchers = this.authService.hasAllPermissions(this.program.id, [
      Permission.PaymentVoucherREAD,
    ]);
  }
}

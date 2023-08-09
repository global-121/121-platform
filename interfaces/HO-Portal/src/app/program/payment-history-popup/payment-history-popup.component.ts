import { formatDate } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { DateFormat } from 'src/app/enums/date-format.enum';
import {
  PaymentRowDetail,
  PopupPayoutDetails,
  SinglePayoutDetails,
  TransactionCustomDataAttributes,
} from 'src/app/models/payment.model';
import { Person } from 'src/app/models/person.model';
import { Program } from 'src/app/models/program.model';
import { IntersolvePayoutStatus } from 'src/app/models/transaction-custom-data';
import { Transaction } from 'src/app/models/transaction.model';
import { PastPaymentsService } from 'src/app/services/past-payments.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { environment } from 'src/environments/environment';
import { FspName } from '../../../../../../services/121-service/src/fsp/enum/fsp-name.enum';
import RegistrationStatus from '../../enums/registration-status.enum';
import { PaymentStatusPopupComponent } from '../payment-status-popup/payment-status-popup.component';
import { StatusEnum } from './../../models/status.enum';

@Component({
  selector: 'app-payment-history-popup',
  templateUrl: './payment-history-popup.component.html',
  styleUrls: ['./payment-history-popup.component.scss'],
})
export class PaymentHistoryPopupComponent implements OnInit {
  @Input()
  public person: Person;

  @Input()
  public program: Program;

  @Input()
  private canViewPersonalData = false;

  @Input()
  private canViewPaymentData = false;

  @Input()
  private canViewVouchers = false;

  @Input()
  private canDoSinglePayment = false;

  private programId: number;
  private locale: string;
  private pastTransactions: Transaction[] = [];
  public firstPaymentToShow = 1;
  public lastPaymentId: number;
  public paymentRows: PaymentRowDetail[] = [];
  public content: any;
  public payoutDetails: PopupPayoutDetails;
  public paymentInProgress = false;

  public isInProgress = false;
  public paDisplayName: string;

  constructor(
    private modalController: ModalController,
    private programsService: ProgramsServiceApiService,
    private translate: TranslateService,
    private pastPaymentsService: PastPaymentsService,
  ) {
    this.locale = environment.defaultLocale;
  }

  async ngOnInit() {
    this.programId = this.program?.id;
    this.paDisplayName = `PA #${this.person?.registrationProgramId}`;

    if (this.canViewPersonalData) {
      this.paDisplayName = this.person?.name;
    }

    if (this.canViewPaymentData) {
      this.lastPaymentId = await this.pastPaymentsService.getLastPaymentId(
        this.programId,
      );
      this.pastTransactions = await this.programsService.getTransactions(
        this.programId,
        this.firstPaymentToShow,
        this.person?.referenceId,
      );
      this.fillPaymentRows();
      this.paymentRows.reverse();
    }
  }

  public closeModal() {
    this.modalController.dismiss();
  }

  public resetProgress(): void {
    this.isInProgress = false;
  }

  private getTransactionOfPaymentForRegistration(
    paymentIndex: number,
    referenceId: string,
  ): Transaction {
    return this.pastTransactions.find(
      (transaction) =>
        transaction.payment === paymentIndex &&
        transaction.referenceId === referenceId,
    );
  }

  public enableMessageSentIcon(transaction: Transaction): boolean {
    return (
      transaction.customData &&
      [
        IntersolvePayoutStatus.initialMessage,
        IntersolvePayoutStatus.voucherSent,
      ].includes(transaction.customData.IntersolvePayoutStatus)
    );
  }

  public enableMoneySentIconTable(transaction: Transaction): boolean {
    return (
      (!transaction.customData.IntersolvePayoutStatus ||
        transaction.customData.IntersolvePayoutStatus ===
          IntersolvePayoutStatus.voucherSent) &&
      transaction.status === StatusEnum.success
    );
  }

  private fillPaymentRows() {
    const nrOfPayments = this.program?.distributionDuration;
    const lastPaymentToShow = Math.min(this.lastPaymentId, nrOfPayments);

    for (
      let index = this.firstPaymentToShow;
      index <= lastPaymentToShow;
      index++
    ) {
      const transaction = this.getTransactionOfPaymentForRegistration(
        index,
        this.person.referenceId,
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
        paymentRowValue = {
          paymentIndex: index,
          text: '',
          transaction,
          hasMessageIcon: this.enableMessageSentIcon(transaction),
          hasMoneyIconTable: this.enableMoneySentIconTable(transaction),
          amount: `${transaction.amount} ${this.program?.currency}`,
          fsp: transaction.fsp as FspName,
          sentDate: '',
        };
        paymentRowValue.text = transaction.paymentDate;
        paymentRowValue.sentDate = transaction.paymentDate;
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
        this.enableSinglePayment(paymentRowValue)
      ) {
        this.paymentRows.push(paymentRowValue);
      }
    }
  }

  public hasWaiting(paymentRow: PaymentRowDetail): boolean {
    return !!paymentRow.waiting;
  }

  public hasError(paymentRow: PaymentRowDetail): boolean {
    if (paymentRow.errorMessage) {
      return true;
    }

    if (paymentRow.status === StatusEnum.error) {
      return true;
    }

    return false;
  }

  public enableSinglePayment(paymentRow: PaymentRowDetail): boolean {
    if (!paymentRow) {
      return false;
    }
    const permission = this.canDoSinglePayment;
    const included = this.person.status === RegistrationStatus.included;
    const noPaymentDone = !paymentRow.transaction;
    const noFuturePayment = paymentRow.paymentIndex <= this.lastPaymentId;
    // Note, the number 5 is the same as allowed for the bulk payment as set in program-people-affected.component
    const onlyLast5Payments = paymentRow.paymentIndex > this.lastPaymentId - 5;
    const noPaymentInProgress = !this.paymentInProgress;

    return (
      permission &&
      included &&
      noPaymentDone &&
      noFuturePayment &&
      onlyLast5Payments &&
      noPaymentInProgress
    );
  }

  public hasVoucherSupport(fsp: FspName): boolean {
    const voucherFsps = [
      FspName.intersolveVoucherPaper,
      FspName.intersolveVoucherWhatsapp,
    ];
    return voucherFsps.includes(fsp);
  }

  async rowClick(paymentRow: PaymentRowDetail) {
    let voucherUrl = null;
    let voucherButtons = null;
    let showRetryButton = false;
    let doSinglePaymentDetails: SinglePayoutDetails = null;
    let paymentDetails: PopupPayoutDetails = null;
    const hasWaiting = this.hasWaiting(paymentRow);
    const hasError = this.hasError(paymentRow);
    const isSinglePayment = this.enableSinglePayment(paymentRow);

    if (
      !this.hasVoucherSupport(paymentRow.fsp) &&
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
      this.hasVoucherSupport(paymentRow.fsp as FspName) &&
      !!paymentRow.transaction
    ) {
      await this.programsService
        .exportVoucher(
          this.person.referenceId,
          paymentRow.paymentIndex,
          this.programId,
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
        programId: this.programId,
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
        programId: this.programId,
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

  displayTransactionDateTime(date: string): string {
    return formatDate(date, DateFormat.dayAndTime, this.locale);
  }

  displayTransactionDateOnly(date: string): string {
    return formatDate(date, DateFormat.dateOnly, this.locale);
  }

  public getCustomDataAttributesToShow(paymentRow: PaymentRowDetail) {
    if (paymentRow.transaction?.fsp === FspName.intersolveVisa) {
      return [TransactionCustomDataAttributes.intersolveVisaWalletTokenCode];
    } else {
      return [];
    }
  }
}

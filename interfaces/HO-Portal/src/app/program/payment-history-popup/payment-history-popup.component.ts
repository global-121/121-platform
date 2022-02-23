import { formatDate } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import {
  PaymentColumnDetail,
  PaymentRowDetail,
  PopupPayoutDetails,
  SinglePayoutDetails,
} from 'src/app/models/payment.model';
import { PaStatus, Person, PersonRow } from 'src/app/models/person.model';
import { Program } from 'src/app/models/program.model';
import { IntersolvePayoutStatus } from 'src/app/models/transaction-custom-data';
import { Transaction } from 'src/app/models/transaction.model';
import { PastPaymentsService } from 'src/app/services/past-payments.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { environment } from 'src/environments/environment';
import { PaymentStatusPopupComponent } from '../payment-status-popup/payment-status-popup.component';
import { StatusEnum } from './../../models/status.enum';

@Component({
  selector: 'app-payment-history-popup',
  templateUrl: './payment-history-popup.component.html',
  styleUrls: ['./payment-history-popup.component.scss'],
})
export class PaymentHistoryPopupComponent implements OnInit {
  public person: Person;
  public personRow: PersonRow;
  public programId: number;
  public program: Program;
  private locale: string;
  private dateFormat = 'yyyy-MM-dd, HH:mm';
  private pastTransactions: Transaction[] = [];
  public firstPaymentToShow = 1;
  public lastPaymentId: number;
  public paymentRows: PaymentColumnDetail[] = [];
  public content: any;
  public payoutDetails: PopupPayoutDetails;
  public paymentInProgress = false;

  public readOnly = false;
  public canViewPersonalData: boolean;
  public canUpdatePersonalData = false;
  public canViewPaymentData = true;
  public canViewVouchers = true;
  public canDoSinglePayment = true;

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
    this.canViewPersonalData
      ? (this.paDisplayName = this.person.name)
      : (this.paDisplayName = `PA #${this.person.id}`);

    if (this.canViewPaymentData) {
      this.lastPaymentId = await this.pastPaymentsService.getLastPaymentId(
        this.programId,
      );
      this.pastTransactions = await this.programsService.getTransactions(
        this.programId,
        this.firstPaymentToShow,
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
    const nrOfPayments = this.program.distributionDuration;
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
          amount: `${transaction.amount} ${this.program.currency}`,
          fsp: this.person.fsp,
        };
        if (transaction.status === StatusEnum.success) {
          paymentRowValue.text = formatDate(
            transaction.paymentDate,
            this.dateFormat,
            this.locale,
          );
        } else if (transaction.status === StatusEnum.waiting) {
          paymentRowValue.errorMessage = this.translate.instant(
            'page.program.program-people-affected.transaction.waiting-message',
          );
          paymentRowValue.waiting = true;
          paymentRowValue.text = this.translate.instant(
            'page.program.program-people-affected.transaction.waiting',
          );
        } else {
          paymentRowValue.errorMessage = transaction.error;
          paymentRowValue.text = this.translate.instant(
            'page.program.program-people-affected.transaction.failed',
          );
        }
      }
      this.paymentRows.push(paymentRowValue);
    }
  }
  public hasWaiting(paymentRow: PaymentRowDetail): boolean {
    return !!paymentRow.waiting;
  }

  public hasError(paymentRow: PaymentRowDetail): boolean {
    return !!paymentRow.errorMessage;
  }

  public enableSinglePayment(
    personRow: PersonRow,
    paymentRow: PaymentRowDetail,
  ): boolean {
    const permission = this.canDoSinglePayment;
    const included = personRow.status === PaStatus.included;
    const noPaymentDone = !paymentRow.transaction;
    const noFuturePayment = paymentRow.paymentIndex <= this.lastPaymentId;
    const onlyLast3Payments = paymentRow.paymentIndex > this.lastPaymentId - 3;
    const noPaymentInProgress = !this.paymentInProgress;

    return (
      permission &&
      included &&
      noPaymentDone &&
      noFuturePayment &&
      onlyLast3Payments &&
      noPaymentInProgress
    );
  }

  public hasVoucherSupport(fsp: string): boolean {
    const voucherFsps = ['Intersolve-no-whatsapp', 'Intersolve-whatsapp'];
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
    const isSinglePayment = this.enableSinglePayment(
      this.personRow,
      paymentRow,
    );

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
      this.hasVoucherSupport(this.personRow.fsp) &&
      !!paymentRow.transaction
    ) {
      await this.programsService
        .exportVoucher(this.personRow.referenceId, paymentRow.paymentIndex)
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
        currency: this.program.currency,
      };
    }
    if (this.canDoSinglePayment) {
      showRetryButton = !hasWaiting && hasError;
      doSinglePaymentDetails = {
        paNr: this.personRow.pa,
        amount: this.program.fixedTransferValue,
        currency: this.program.currency,
        multiplier: this.personRow.paymentAmountMultiplier
          ? Number(this.personRow.paymentAmountMultiplier.substr(0, 1))
          : 1,
        programId: this.programId,
        payment: paymentRow.paymentIndex,
        referenceId: this.personRow.referenceId,
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
}

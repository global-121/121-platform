import { formatCurrency, formatDate } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import {
  PaymentColumnDetail,
  PopupPayoutDetails,
} from 'src/app/models/payment.model';
import { Person } from 'src/app/models/person.model';
import { Program } from 'src/app/models/program.model';
import {
  IntersolvePayoutStatus,
  TransactionCustomData,
} from 'src/app/models/transaction-custom-data';
import { Transaction } from 'src/app/models/transaction.model';
import { PastPaymentsService } from 'src/app/services/past-payments.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { environment } from 'src/environments/environment';
import { StatusEnum } from './../../models/status.enum';

@Component({
  selector: 'app-payment-history-popup',
  templateUrl: './payment-history-popup.component.html',
  styleUrls: ['./payment-history-popup.component.scss'],
})
export class PaymentHistoryPopupComponent implements OnInit {
  public person: Person;
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

  public readOnly = false;
  public canViewPersonalData: boolean;
  public canUpdatePersonalData = false;
  public canViewPaymentData = true;

  public isInProgress = false;
  public paDisplayName: string;

  constructor(
    private modalController: ModalController,
    private programsService: ProgramsServiceApiService,
    private translate: TranslateService,
    private alertController: AlertController,
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

  public async getMessageTitle() {
    const intersolveMessageTime = await this.getTransactionTime(
      TransactionCustomData.intersolvePayoutStatus,
      IntersolvePayoutStatus.initialMessage,
    );
    if (intersolveMessageTime) {
      return this.translate.instant(
        'page.program.program-people-affected.payment-history-popup.message-title',
        {
          payment: this.payoutDetails.payment,
          timestamp: intersolveMessageTime,
        },
      );
    }
  }

  public async getMoneyTitle() {
    const intersolveMoneyTime = await this.getTransactionTime(
      TransactionCustomData.intersolvePayoutStatus,
      IntersolvePayoutStatus.voucherSent,
    );
    if (intersolveMoneyTime) {
      return this.translate.instant(
        'page.program.program-people-affected.payment-history-popup.money-title',
        {
          payment: this.payoutDetails.payment,
          timestamp: intersolveMoneyTime,
        },
      );
    }
    const otherMoneyTime = await this.getTransactionTime('', '');
    if (otherMoneyTime) {
      return this.translate.instant(
        'page.program.program-people-affected.payment-history-popup.money-title',
        {
          payment: this.payoutDetails.payment,
          timestamp: otherMoneyTime,
        },
      );
    }

    return '';
  }

  public async getTransactionTime(customKey: string, customValue: string) {
    const transaction = await this.programsService.getTransaction(
      this.payoutDetails.referenceId,
      this.payoutDetails.programId,
      this.payoutDetails.payment,
      customKey,
      customValue,
    );
    if (transaction && transaction.status === StatusEnum.success) {
      return formatDate(transaction.paymentDate, this.dateFormat, this.locale);
    }
  }

  public async retryPayment() {
    this.doPayment(this.payoutDetails);
  }

  public resetProgress(): void {
    this.isInProgress = false;
  }

  public async doPayment(payoutDetails) {
    this.isInProgress = true;
    await this.programsService
      .submitPayout(
        payoutDetails.programId,
        payoutDetails.payment,
        payoutDetails.amount,
        [payoutDetails.referenceId],
      )
      .then(
        (response) => {
          this.isInProgress = false;
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
          this.isInProgress = false;
        },
      );
  }

  public async getBalance() {
    this.isInProgress = true;
    await this.programsService
      .getBalance(this.payoutDetails.referenceId, this.payoutDetails.payment)
      .then(
        (response) => {
          this.isInProgress = false;
          const message = this.translate.instant(
            'page.program.program-people-affected.payment-history-popup.current-balance',
            {
              currentBalance: this.formatCurrency(response),
              timestamp: formatDate(new Date(), this.dateFormat, this.locale),
            },
          );
          this.actionResult(message);
        },
        (err) => {
          console.log('err: ', err);
          if (err && err.error && err.error.error) {
            this.actionResult(err.error.error);
          }
          this.isInProgress = false;
        },
      );
  }

  public async printVoucher() {
    const oHideFrame: any = document.getElementById('voucherIframe');
    const contentWindow = oHideFrame.contentWindow;
    contentWindow.focus(); // Required for IE
    contentWindow.print();
  }

  private formatCurrency(balance) {
    const symbol = `${this.payoutDetails.currency} `;
    return formatCurrency(
      balance,
      environment.defaultLocale,
      symbol,
      this.payoutDetails.currency,
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

      let paymentRowText;

      if (!transaction) {
        paymentRowText = 'Do single payment placeholder';
        const paymentRowValue: PaymentColumnDetail = {
          paymentIndex: index,
          text: paymentRowText,
        };
        this.paymentRows.push(paymentRowValue);
      } else {
        if (transaction.status === StatusEnum.success) {
          paymentRowText = formatDate(
            transaction.paymentDate,
            this.dateFormat,
            this.locale,
          );
        } else if (transaction.status === StatusEnum.waiting) {
          this.paymentRows['payment' + index + '-error'] =
            this.translate.instant(
              'page.program.program-people-affected.transaction.waiting-message',
            );
          this.paymentRows['payment' + index + '-waiting'] = true;
          paymentRowText = this.translate.instant(
            'page.program.program-people-affected.transaction.waiting',
          );
        } else {
          this.paymentRows['payment' + index + '-error'] = transaction.error;
          this.paymentRows['payment' + index + '-amount'] = transaction.amount;
          paymentRowText = this.translate.instant(
            'page.program.program-people-affected.transaction.failed',
          );
        }

        const paymentRowValue: PaymentColumnDetail = {
          paymentIndex: index,
          text: paymentRowText,
          amount: `${this.program.currency} ${transaction.amount}`,
        };
        this.paymentRows.push(paymentRowValue);
      }
    }
  }

  rowClick(paDisplayName: any) {
    console.log(paDisplayName);
  }
}

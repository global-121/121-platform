import { formatCurrency, formatDate } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { AlertController, ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { DateFormat } from 'src/app/enums/date-format.enum';
import {
  PopupPayoutDetails,
  SinglePayoutDetails,
} from 'src/app/models/payment.model';
import {
  IntersolvePayoutStatus,
  TransactionCustomData,
} from 'src/app/models/transaction-custom-data';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { environment } from 'src/environments/environment';
import { StatusEnum } from './../../models/status.enum';

@Component({
  selector: 'app-payment-status-popup',
  templateUrl: './payment-status-popup.component.html',
  styleUrls: ['./payment-status-popup.component.scss'],
})
export class PaymentStatusPopupComponent implements OnInit {
  public titleMessageIcon: string;
  public titleMoneyIcon: string;
  public titleError: string;
  public titleSinglePayment: string;

  private locale: string;

  public title: string;
  public content: any;
  public showRetryButton: boolean;
  public payoutDetails: PopupPayoutDetails;
  public voucherButtons: boolean;
  public imageUrl: string;
  public sanitizedIimageUrl: string;

  public singlePaymentPayout: string;
  public singlePayoutDetails: SinglePayoutDetails;
  public totalAmountMessage: string;
  public totalIncludedMessage: string;

  public isInProgress = false;

  constructor(
    private modalController: ModalController,
    private sanitizer: DomSanitizer,
    private programsService: ProgramsServiceApiService,
    private translate: TranslateService,
    private alertController: AlertController,
  ) {
    this.locale = environment.defaultLocale;
  }

  async ngOnInit() {
    if (this.singlePayoutDetails) {
      this.singlePaymentPayout = this.translate.instant(
        'page.program.program-people-affected.payment-status-popup.single-payment.start-payout',
        { paNr: this.singlePayoutDetails.paNr },
      );
    }
    if (this.payoutDetails) {
      this.titleMessageIcon = await this.getMessageTitle();
      this.titleMoneyIcon = await this.getMoneyTitle();
    }

    if (this.imageUrl) {
      this.sanitizedIimageUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
        this.imageUrl,
      ) as string;
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
        'page.program.program-people-affected.payment-status-popup.message-title',
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
        'page.program.program-people-affected.payment-status-popup.money-title',
        {
          payment: this.payoutDetails.payment,
          timestamp: intersolveMoneyTime,
        },
      );
    }
    const otherMoneyTime = await this.getTransactionTime('', '');
    if (otherMoneyTime) {
      return this.translate.instant(
        'page.program.program-people-affected.payment-status-popup.money-title',
        {
          payment: this.payoutDetails.payment,
          timestamp: otherMoneyTime,
        },
      );
    }
    if (this.titleMessageIcon) {
      return this.translate.instant(
        'page.program.program-people-affected.payment-status-popup.money-title',
        { payment: this.payoutDetails.payment, timestamp: '' },
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

    if (!transaction) {
      return null;
    }

    if (transaction.status === StatusEnum.success) {
      return formatDate(
        transaction.paymentDate,
        DateFormat.dayAndTime,
        this.locale,
      );
    }
  }

  public updateTotalAmountMessage(): void {
    const cost = this.singlePayoutDetails.amount;
    const symbol = `${this.singlePayoutDetails.currency} `;
    const costFormatted = formatCurrency(
      cost,
      environment.defaultLocale,
      symbol,
      this.singlePayoutDetails.currency,
    );
    const totalCost = cost * this.singlePayoutDetails.multiplier;
    const totalCostFormatted = formatCurrency(
      totalCost,
      environment.defaultLocale,
      symbol,
      this.singlePayoutDetails.currency,
    );

    this.totalIncludedMessage = this.translate.instant(
      'page.program.program-payout.total-included',
      { totalIncluded: 1 },
    );

    this.totalAmountMessage = this.translate.instant(
      'page.program.program-people-affected.payment-status-popup.single-payment.total-amount',
      {
        cost: costFormatted,
        multiplier: this.singlePayoutDetails.multiplier,
        totalCost: totalCostFormatted,
      },
    );
  }

  public async retryPayment() {
    this.doPayment(this.payoutDetails);
  }

  public async singlePayment() {
    this.doPayment(this.singlePayoutDetails);
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
      .getBalance(
        this.payoutDetails.referenceId,
        this.payoutDetails.payment,
        this.payoutDetails.programId,
      )
      .then(
        (response) => {
          this.isInProgress = false;
          const message = this.translate.instant(
            'page.program.program-people-affected.payment-status-popup.current-balance',
            {
              currentBalance: this.formatCurrency(response),
              timestamp: formatDate(
                new Date(),
                DateFormat.dayAndTime,
                this.locale,
              ),
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
}

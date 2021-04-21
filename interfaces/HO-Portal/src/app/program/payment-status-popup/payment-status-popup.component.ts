import { formatCurrency, formatDate } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { AlertController, ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { PopupPayoutDetails } from 'src/app/models/installment.model';
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

  private locale: string;
  private dateFormat = 'yyyy-MM-dd, HH:mm';

  public title: string;
  public content: any;
  public contentNotes: any;
  public retryButton: boolean;
  public payoutDetails: PopupPayoutDetails;
  public voucherButtons: boolean;
  public imageUrl: string;
  public sanitizedIimageUrl: string;

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
          installment: this.payoutDetails.installment,
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
          installment: this.payoutDetails.installment,
          timestamp: intersolveMoneyTime,
        },
      );
    }
    const otherMoneyTime = await this.getTransactionTime('', '');
    if (otherMoneyTime) {
      return this.translate.instant(
        'page.program.program-people-affected.payment-status-popup.money-title',
        {
          installment: this.payoutDetails.installment,
          timestamp: otherMoneyTime,
        },
      );
    }
    if (this.titleMessageIcon) {
      return this.translate.instant(
        'page.program.program-people-affected.payment-status-popup.money-title',
        { installment: this.payoutDetails.installment, timestamp: '' },
      );
    }
    return '';
  }

  public async getTransactionTime(customKey: string, customValue: string) {
    const transaction = await this.programsService.getTransaction(
      this.payoutDetails.did,
      Number(this.payoutDetails.programId),
      Number(this.payoutDetails.installment),
      customKey,
      customValue,
    );
    if (transaction && transaction.status === StatusEnum.success) {
      return formatDate(
        transaction.installmentDate,
        this.dateFormat,
        this.locale,
      );
    }
  }

  public async retryPayment() {
    this.isInProgress = true;
    await this.programsService
      .submitPayout(
        +this.payoutDetails.programId,
        +this.payoutDetails.installment,
        +this.payoutDetails.amount,
        this.payoutDetails.did,
      )
      .then(
        (response) => {
          this.isInProgress = false;
          const message = ''
            .concat(
              response.nrSuccessfull > 0
                ? this.translate.instant(
                    'page.program.program-payout.result-success',
                    { nrSuccessfull: response.nrSuccessfull },
                  )
                : '',
            )
            .concat(
              response.nrFailed > 0
                ? '<br><br>' +
                    this.translate.instant(
                      'page.program.program-payout.result-failure',
                      { nrFailed: response.nrFailed },
                    )
                : '',
            )
            .concat(
              response.nrWaiting > 0
                ? '<br><br>' +
                    this.translate.instant(
                      'page.program.program-payout.result-waiting',
                      { nrWaiting: response.nrWaiting },
                    )
                : '',
            );
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
      .getBalance(this.payoutDetails.did, this.payoutDetails.installment)
      .then(
        (response) => {
          this.isInProgress = false;
          const message = this.translate.instant(
            'page.program.program-people-affected.payment-status-popup.current-balance',
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
}

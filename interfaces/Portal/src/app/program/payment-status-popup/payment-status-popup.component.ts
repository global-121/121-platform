import { formatCurrency, formatDate } from '@angular/common';
import { Component, OnInit, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { AlertController, ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { DateFormat } from 'src/app/enums/date-format.enum';
import {
  PayoutDetails,
  SinglePayoutDetails,
} from 'src/app/models/payment.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { PaymentUtils } from 'src/app/shared/payment.utils';
import { environment } from 'src/environments/environment';
import { Program } from '../../models/program.model';
import { actionResult } from '../../shared/action-result';
import {
  getFspIntegrationType,
  getPaymentResultText,
} from '../../shared/payment-result';

@Component({
  selector: 'app-payment-status-popup',
  templateUrl: './payment-status-popup.component.html',
  styleUrls: ['./payment-status-popup.component.scss'],
})
export class PaymentStatusPopupComponent implements OnInit {
  public titleTransaction: string;
  public titleSinglePayment: string;

  private locale: string;

  public title: string;
  public content: any;
  public showRetryButton: boolean;
  public payoutDetails: PayoutDetails;
  public voucherButtons: boolean;
  public imageUrl: string;
  public sanitizedImageUrl: string;
  public imageFileName: string;

  public singlePaymentPayout: string;
  public singlePayoutDetails: SinglePayoutDetails;
  public totalAmountMessage: string;
  public totalIncludedMessage: string;
  private program: Program;

  public isInProgress = false;

  constructor(
    private modalController: ModalController,
    private domSanitizer: DomSanitizer,
    private programsService: ProgramsServiceApiService,
    private translate: TranslateService,
    private alertController: AlertController,
  ) {
    this.locale = this.translate.currentLang || environment.defaultLocale;
  }

  async ngOnInit() {
    if (this.singlePayoutDetails) {
      this.updateTotalAmountMessage();
      this.singlePaymentPayout = this.translate.instant(
        'page.program.program-people-affected.payment-status-popup.single-payment.start-payout',
        { paNr: this.singlePayoutDetails.paNr },
      );
    }
    if (this.payoutDetails) {
      this.titleTransaction = await this.getTitle();

      if (this.imageUrl) {
        this.sanitizedImageUrl =
          this.domSanitizer.bypassSecurityTrustResourceUrl(
            this.domSanitizer.sanitize(SecurityContext.URL, this.imageUrl),
          ) as string;
        this.imageFileName = `voucher-program-${this.payoutDetails.programId}-payment-${this.payoutDetails.payment}-PA-${this.payoutDetails.paNr}.png`;
      }
    }
  }

  public closeModal() {
    this.modalController.dismiss();
  }

  public async getTitle() {
    const intersolveMessageTime = await this.getTransactionTime();
    if (intersolveMessageTime) {
      return this.translate.instant(
        'page.program.program-people-affected.payment-status-popup.status-title',
        {
          payment: this.payoutDetails.payment,
          timestamp: intersolveMessageTime,
        },
      );
    }
  }

  public async getTransactionTime(): Promise<string | null> {
    const transaction = (
      await this.programsService.getTransactions(
        this.payoutDetails.programId,
        this.payoutDetails.referenceId,
        this.payoutDetails.payment,
      )
    )[0];

    if (!transaction) {
      return null;
    }

    return formatDate(
      transaction.paymentDate,
      DateFormat.dayAndTime,
      this.locale,
    );
  }

  public updateTotalAmountMessage(): void {
    const cost = this.singlePayoutDetails.amount;
    const symbol = `${this.singlePayoutDetails.currency} `;
    const costFormatted = formatCurrency(
      cost,
      this.locale,
      symbol,
      this.singlePayoutDetails.currency,
    );
    const totalCost = cost * this.singlePayoutDetails.multiplier;
    const totalCostFormatted = formatCurrency(
      totalCost,
      this.locale,
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
    this.doPayment(this.payoutDetails, true);
  }

  public async singlePayment() {
    this.doPayment(this.singlePayoutDetails, false);
  }

  public resetProgress(): void {
    this.isInProgress = false;
  }

  public async doPayment(payoutDetails, retry: boolean) {
    this.isInProgress = true;
    const result = retry
      ? this.programsService.patchPayout(
          payoutDetails.programId,
          payoutDetails.payment,
          [payoutDetails.referenceId],
        )
      : this.programsService.doPayment(
          payoutDetails.programId,
          payoutDetails.payment,
          payoutDetails.amount,
          false,
          PaymentUtils.refernceIdsToFilter([payoutDetails.referenceId]),
        );

    result.then(
      (response) => {
        this.isInProgress = false;
        let message = '';

        if (response) {
          const fspIntegrationType = getFspIntegrationType(
            response.fspsInPayment ||
              this.program.financialServiceProviders.map((fsp) => fsp.fsp),
            this.program,
          );
          message += getPaymentResultText(
            response.applicableCount,
            fspIntegrationType,
            this.translate,
          );
        }
        actionResult(this.alertController, this.translate, message, true);
      },
      (err) => {
        console.log('err: ', err);
        if (err && err.error && err.error.errors) {
          actionResult(this.alertController, this.translate, err.error.errors);
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
          actionResult(this.alertController, this.translate, message);
        },
        (err) => {
          console.log('err: ', err);
          if (err && err.error && err.error.error) {
            actionResult(this.alertController, this.translate, err.error.error);
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
      this.locale,
      symbol,
      this.payoutDetails.currency,
    );
  }
}

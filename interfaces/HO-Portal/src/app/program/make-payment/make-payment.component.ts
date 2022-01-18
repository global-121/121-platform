import { formatCurrency } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Program } from 'src/app/models/program.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { environment } from 'src/environments/environment';
import { FspIntegrationType } from '../../models/fsp.model';
import { PastPaymentsService } from '../../services/past-payments.service';

@Component({
  selector: 'app-make-payment',
  templateUrl: './make-payment.component.html',
  styleUrls: ['./make-payment.component.scss'],
})
export class MakePaymentComponent implements OnInit {
  @Input()
  public programId: number;

  @Input()
  public payment: number;

  @Input()
  public referenceIds: string[];

  public isEnabled: boolean;
  public isInProgress: boolean;

  public program: Program;
  public totalIncluded: number;
  public totalTransferAmounts: number;
  public lastPaymentId: number;
  private fspIntegrationType: FspIntegrationType;

  public amountInput: number;
  public totalAmountMessage: string;
  public totalIncludedMessage: string;

  public paymentInProgress = false;

  constructor(
    private programsService: ProgramsServiceApiService,
    private pastPaymentsService: PastPaymentsService,
    private translate: TranslateService,
    private alertController: AlertController,
    private router: Router,
  ) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.ngOnInit();
      }
    });
  }

  async ngOnInit() {
    this.program = await this.programsService.getProgramById(this.programId);

    await this.getFspIntegrationType();

    this.amountInput = this.program.fixedTransferValue;
    if (!this.referenceIds) {
      const totalIncluded = await this.programsService.getTotalIncluded(
        this.programId,
      );
      this.totalIncluded = totalIncluded.registrations;
      this.totalTransferAmounts = totalIncluded.transferAmounts;
    } else {
      this.totalIncluded = this.referenceIds.length;
      this.totalTransferAmounts = null; // TO DO!!!
    }
    this.lastPaymentId = await this.pastPaymentsService.getLastPaymentId(
      this.programId,
    );

    this.paymentInProgress =
      await this.pastPaymentsService.checkPaymentInProgress(this.programId);
    this.updateTotalAmountMessage();
    this.checkIsEnabled();
  }

  private checkIsEnabled(): boolean {
    this.isEnabled =
      this.totalIncluded > 0 &&
      this.lastPaymentId < this.program.distributionDuration &&
      !this.paymentInProgress;
    return this.isEnabled;
  }

  public async performPayment(): Promise<void> {
    this.isInProgress = true;

    const paymentId =
      this.payment ||
      (await this.pastPaymentsService.getNextPaymentId(this.program));
    const referenceIds = this.referenceIds.length ? this.referenceIds : null;

    await this.programsService
      .submitPayout(this.programId, paymentId, this.amountInput, referenceIds)
      .then(
        (response) => this.onPaymentSuccess(response),
        (error) => this.onPaymentError(error),
      );
  }

  async getFspIntegrationType() {
    // Theoretically a program could contain multiple FSP's with different integrationTypes, in practice this does not happen yet
    this.fspIntegrationType =
      this.program.financialServiceProviders[0].integrationType;
  }

  private getPaymentResultText(nrPa: number) {
    let message = '';
    if (this.fspIntegrationType === FspIntegrationType.api) {
      message += this.translate.instant(
        'page.program.program-payout.result.api',
        {
          nrPa: `<strong>${nrPa}</strong>`,
        },
      );
    } else if (this.fspIntegrationType === FspIntegrationType.csv) {
      message += this.translate.instant(
        'page.program.program-payout.result.csv',
        {
          nrPa: `<strong>${nrPa}</strong>`,
        },
      );
    }
    return message;
  }

  private onPaymentSuccess(response) {
    this.resetProgress();
    let message = '';

    if (response) {
      message += this.getPaymentResultText(response);
    }
    this.actionResult(message, true);
  }

  private onPaymentError(error) {
    if (error && error.error && error.error.errors) {
      this.actionResult(error.error.errors);
    } else {
      this.actionResult(
        this.translate.instant(
          'page.program.program-payout.make-payment.error.generic',
        ),
      );
    }
    this.resetProgress();
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

  public resetProgress(): void {
    this.isInProgress = false;
  }

  public updateTotalAmountMessage(): void {
    const totalCost = this.totalTransferAmounts * this.amountInput;
    const symbol = `${this.program.currency} `;
    const totalCostFormatted = formatCurrency(
      totalCost,
      environment.defaultLocale,
      symbol,
      this.program.currency,
    );

    this.totalIncludedMessage = this.translate.instant(
      'page.program.program-payout.total-included',
      { totalIncluded: this.totalIncluded },
    );

    this.totalAmountMessage = this.translate.instant(
      'page.program.program-payout.total-amount',
      { totalCost: totalCostFormatted },
    );
  }

  public refresh() {
    window.location.reload();
  }
}

import { formatCurrency } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { ActionType } from 'src/app/models/actions.model';
import { Program } from 'src/app/models/program.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-make-payment',
  templateUrl: './make-payment.component.html',
  styleUrls: ['./make-payment.component.scss'],
})
export class MakePaymentComponent implements OnInit {
  @Input()
  public programId: number;

  @Input()
  public program: Program;

  public isEnabled: boolean;
  public isInProgress: boolean;

  public totalIncluded: number;
  public totalTransferAmounts: number;
  public lastInstallmentId: number;

  public amountInput: number;
  public totalAmountMessage: string;
  public totalIncludedMessage: string;

  public paymentInProgress = false;

  constructor(
    private programsService: ProgramsServiceApiService,
    private translate: TranslateService,
    private alertController: AlertController,
  ) {}

  async ngOnInit() {
    if (!this.program) {
      return;
    }
    this.amountInput = this.program.fixedTransferValue;
    const totalIncluded = await this.programsService.getTotalIncluded(
      this.programId,
    );
    this.totalIncluded = totalIncluded.connections;
    this.totalTransferAmounts = totalIncluded.transferAmounts;
    this.lastInstallmentId = await this.programsService.getLastInstallmentId(
      this.programId,
    );

    this.paymentInProgress = await this.checkPaymentInProgress();
    this.updateTotalAmountMessage();
    this.checkIsEnabled();
  }

  private checkIsEnabled(): boolean {
    this.isEnabled =
      this.totalIncluded > 0 &&
      this.lastInstallmentId < this.program.distributionDuration &&
      !this.paymentInProgress;
    return this.isEnabled;
  }

  private async getNextInstallmentId(): Promise<number> {
    let previousId = 0;

    if (this.lastInstallmentId > 0) {
      previousId = this.lastInstallmentId;
    }

    return previousId + 1;
  }

  public async performPayment(): Promise<void> {
    this.isInProgress = true;

    const nextInstallmentId = await this.getNextInstallmentId();

    await this.programsService
      .submitPayout(this.programId, nextInstallmentId, this.amountInput)
      .then(
        (response) => this.onPaymentSuccess(response),
        (error) => this.onPaymentError(error),
      );
  }

  private onPaymentSuccess(response) {
    this.resetProgress();
    let message = '';

    if (response) {
      message += this.translate.instant('page.program.program-payout.result', {
        nrPa: `<strong>${response}</strong>`,
      });
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

  public async checkPaymentInProgress(): Promise<boolean> {
    const latestPaymentStartedAction =
      await this.programsService.retrieveLatestActions(
        ActionType.paymentStarted,
        this.programId,
      );
    // If never started, then not in progress
    if (!latestPaymentStartedAction) {
      return false;
    }
    const latestPaymentFinishedAction =
      await this.programsService.retrieveLatestActions(
        ActionType.paymentFinished,
        this.programId,
      );
    // If started, but never finished, then in progress
    if (!latestPaymentFinishedAction) {
      return true;
    }
    // If started and finished, then compare timestamps
    const startTimestamp = new Date(latestPaymentStartedAction.timestamp);
    const finishTimestamp = new Date(latestPaymentFinishedAction.timestamp);
    return finishTimestamp < startTimestamp;
  }

  public refresh() {
    window.location.reload();
  }
}

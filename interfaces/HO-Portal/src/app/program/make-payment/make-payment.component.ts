import { formatCurrency } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { InstallmentData } from 'src/app/models/installment.model';
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
  public pastPayments: InstallmentData[];

  public amountInput: number;
  public totalAmountMessage: string;

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
    this.totalIncluded = await this.programsService.getTotalIncluded(
      this.programId,
    );
    this.pastPayments = await this.programsService.getPastInstallments(
      this.programId,
    );

    this.updateTotalAmountMessage();
    this.checkIsEnabled();
  }

  private checkIsEnabled(): boolean {
    this.isEnabled =
      this.totalIncluded > 0 &&
      this.pastPayments.length < this.program.distributionDuration;
    return this.isEnabled;
  }

  private async getNextInstallmentId(): Promise<number> {
    let previousId = 0;
    if (this.pastPayments && this.pastPayments.length > 0) {
      previousId = this.pastPayments[this.pastPayments.length - 1].id;
    }

    return previousId + 1;
  }

  public async performPayment(): Promise<void> {
    this.isInProgress = true;

    const nextInstallmentId = await this.getNextInstallmentId();

    await this.programsService
      .submitPayout(
        Number(this.programId),
        nextInstallmentId,
        Number(this.amountInput),
      )
      .then(
        (response) => this.onPaymentSuccess(response),
        (error) => this.onPaymentError(error),
      );
  }

  private onPaymentSuccess(response) {
    this.resetProgress();
    let message = '';

    if (response.nrSuccessfull > 0) {
      message += this.translate.instant(
        'page.program.program-payout.result-success',
        {
          nrSuccessfull: response.nrSuccessfull,
        },
      );
      message += '<br><br>';
    }
    if (response.nrFailed > 0) {
      message += this.translate.instant(
        'page.program.program-payout.result-failure',
        {
          nrFailed: response.nrFailed,
        },
      );
      message += '<br><br>';
    }
    if (response.nrWaiting > 0) {
      message += this.translate.instant(
        'page.program.program-payout.result-waiting',
        {
          nrWaiting: response.nrWaiting,
        },
      );
    }
    this.actionResult(message, true);
  }

  private onPaymentError(error) {
    if (error.error.errors) {
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
    const totalCost = this.totalIncluded * this.amountInput;
    const symbol = `${this.program.currency} `;
    const paymentCostFormatted = formatCurrency(
      this.amountInput,
      environment.defaultLocale,
      symbol,
      this.program.currency,
    );
    const totalCostFormatted = formatCurrency(
      totalCost,
      environment.defaultLocale,
      symbol,
      this.program.currency,
    );

    this.totalAmountMessage = `${this.totalIncluded} * ${paymentCostFormatted} = ${totalCostFormatted}`;
  }
}

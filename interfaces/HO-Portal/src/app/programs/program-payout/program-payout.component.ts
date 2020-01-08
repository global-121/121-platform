import { Component, Input, SimpleChanges, OnChanges } from '@angular/core';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { formatCurrency } from '@angular/common';

@Component({
  selector: 'app-program-payout',
  templateUrl: './program-payout.component.html',
  styleUrls: ['./program-payout.component.scss'],
})
export class ProgramPayoutComponent implements OnChanges {
  @Input()
  public programId: number;

  @Input()
  public fixedTransferValue: number;

  @Input()
  public currencyCode: string;

  public isEnabled = true;
  public isInProgress = false;

  public transferValue: any;

  private locale: string;
  private totalIncluded: number;

  constructor(
    private programsService: ProgramsServiceApiService,
    private translate: TranslateService,
    private alertController: AlertController,
  ) {
    this.locale = this.translate.getBrowserCultureLang();
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (typeof changes.programId.currentValue === 'number') {
      this.totalIncluded = await this.programsService.getTotalIncluded(this.programId);
    }
  }

  public submitPayout() {
    this.isEnabled = false;

    this.payoutConfirm();

    return false;
  }

  private createTotalAmountMessage() {
    const totalCost = this.totalIncluded * this.transferValue;
    const symbol = `${this.currencyCode} `;
    const totalCostFormatted = formatCurrency(totalCost, this.locale, symbol, this.currencyCode);

    return `${this.totalIncluded} * ${this.transferValue} = ${totalCostFormatted}`;
  }

  private async payoutConfirm() {
    const alert = await this.alertController.create({
      header: this.translate.instant('common.confirm'),
      subHeader: this.translate.instant('page.programs.program-payout.total-amount'),
      message: this.createTotalAmountMessage(),
      buttons: [
        {
          text: this.translate.instant('common.cancel'),
          role: 'cancel',
          handler: () => {
            this.cancelPayout();
          },
        },
        {
          text: this.translate.instant('common.ok'),
          handler: () => {
            this.performPayout();
          }
        },
      ]
    });

    await alert.present();
  }

  private cancelPayout() {
    this.isEnabled = true;
    this.isInProgress = false;
  }

  private async performPayout() {
    this.isInProgress = true;
    console.log('Paying out...', this.transferValue);
    this.programsService.submitPayout(this.programId, this.transferValue)
      .then(
        () => {
          this.isInProgress = false;
          this.payoutResult(this.translate.instant('page.programs.program-payout.payout-success'));
        },
        () => {
          this.payoutResult(this.translate.instant('page.programs.program-payout.payout-error'));
          this.cancelPayout();
        }
      );
  }

  private async payoutResult(resultMessage: string) {
    const alert = await this.alertController.create({
      message: resultMessage,
      buttons: [
        this.translate.instant('common.ok'),
      ],
    });

    await alert.present();
  }
}

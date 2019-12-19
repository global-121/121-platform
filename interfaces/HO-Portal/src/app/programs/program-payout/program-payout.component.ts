import { Component, Input } from '@angular/core';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-program-payout',
  templateUrl: './program-payout.component.html',
  styleUrls: ['./program-payout.component.scss'],
})
export class ProgramPayoutComponent {
  @Input()
  public programId: number;

  @Input()
  public fixedTransferValue: number;

  public isEnabled = true;
  public isInProgress = false;

  constructor(
    private programsService: ProgramsServiceApiService,
    private translate: TranslateService,
    private alertController: AlertController,
  ) { }

  public submitPayout() {
    this.isEnabled = false;
    this.payoutConfirm();

    return false;
  }

  private async payoutConfirm() {
    const alert = await this.alertController.create({
      header: this.translate.instant('common.confirm'),
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
    console.log('Paying out...', this.fixedTransferValue);
    this.programsService.submitPayout(this.programId, this.fixedTransferValue)
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

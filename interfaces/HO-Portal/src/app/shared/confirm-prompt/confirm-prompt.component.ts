import { Component, OnInit, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'confirm-prompt',
  templateUrl: './confirm-prompt.component.html',
  styleUrls: ['./confirm-prompt.component.scss'],
})
export class ConfirmPromptComponent implements OnInit {

  @Input()
  public disabled: boolean;

  @Input()
  public confirmAction: () => void;

  @Input()
  public cancelAction: () => void;

  constructor(
    public translate: TranslateService,
    private alertController: AlertController,
  ) {
  }

  ngOnInit() {
  }

  public async showPrompt() {
    const alert = await this.alertController.create({
      header: this.translate.instant('common.confirm'),
      buttons: [
        {
          text: this.translate.instant('common.cancel'),
          role: 'cancel',
          handler: () => {
            if (this.cancelAction) {
              this.cancelAction();
            }
          },
        },
        {
          text: this.translate.instant('common.ok'),
          handler: () => {
            if (this.confirmAction) {
              this.confirmAction();
            }
          },
        },
      ]
    });

    await alert.present();
  }

}

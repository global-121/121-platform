import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'confirm-prompt',
  templateUrl: './confirm-prompt.component.html',
  styleUrls: ['./confirm-prompt.component.scss'],
})
export class ConfirmPromptComponent {
  @Input()
  public disabled: boolean;

  @Input()
  public subHeader: string;

  @Input()
  public message: string;

  @Input()
  public size: string;

  @Input()
  public fill: string;

  @Output()
  private confirm = new EventEmitter<void>();

  @Output()
  private cancel = new EventEmitter<void>();

  constructor(
    public translate: TranslateService,
    private alertController: AlertController,
  ) {}

  public async showPrompt() {
    this.disabled = true;

    const alert = await this.alertController.create({
      header: this.translate.instant('common.confirm'),
      subHeader: this.subHeader,
      message: this.message,
      buttons: [
        {
          text: this.translate.instant('common.cancel'),
          role: 'cancel',
          handler: () => {
            this.cancel.emit();
            this.disabled = false;
          },
        },
        {
          text: this.translate.instant('common.ok'),
          handler: () => {
            this.confirm.emit();
            this.disabled = false;
          },
        },
      ],
    });

    await alert.present();
  }
}

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { AlertInputField } from 'src/app/models/alert-input-field';

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

  @Input()
  public inputFields: AlertInputField[];

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
      inputs: this.inputFields || [],
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
          handler: (data) => {
            this.confirm.emit(data);
            this.disabled = false;
          },
        },
      ],
    });

    await alert.present();
  }
}

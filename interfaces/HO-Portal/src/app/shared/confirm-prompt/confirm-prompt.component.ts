import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import {
  FilePickerPromptComponent,
  FilePickerProps,
} from '../file-picker-prompt/file-picker-prompt.component';
import {
  InputPromptComponent,
  InputProps,
} from '../input-prompt/input-prompt.component';

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
  public color: string;

  @Input()
  public inputProps: InputProps;

  @Input()
  public filePickerProps: FilePickerProps;

  @Output()
  private confirm = new EventEmitter<string>();

  @Output()
  private cancel = new EventEmitter<void>();

  constructor(
    public translate: TranslateService,
    private modalController: ModalController,
  ) {}

  public async showPrompt() {
    this.disabled = true;

    let modal: HTMLIonModalElement;
    if (this.filePickerProps) {
      modal = await this.modalController.create({
        component: FilePickerPromptComponent,
        componentProps: {
          subHeader: this.subHeader,
          message: this.message,
          filePickerProps: this.filePickerProps,
        },
      });
    } else {
      modal = await this.modalController.create({
        component: InputPromptComponent,
        componentProps: {
          subHeader: this.subHeader,
          message: this.message,
          inputProps: this.inputProps,
        },
      });
    }

    modal.onDidDismiss().then((data) => {
      this.disabled = false;

      if (data.role) {
        this.cancel.emit();
        return;
      }

      this.confirm.emit(data.data);
    });

    await modal.present();
  }
}

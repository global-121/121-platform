import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  Input,
  ViewChild,
} from '@angular/core';
import { NgModel } from '@angular/forms';
import { AlertController, ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { actionResult } from '../action-result';

export interface InputProps {
  checkbox?: string;
  checkboxChecked?: boolean;
  inputRequired?: boolean;
  explanation?: string;
  placeholder?: string | undefined;
  defaultValue?: string;
  titleTranslationKey?: string;
  okTranslationKey?: string;
  cancelAlertTranslationKey?: string;
  inputConstraint?: {
    length: number;
    type: 'min' | 'max';
  };
  isTemplated?: boolean;
  templatedMessage?: string;
  supportMessage?: string;
  messageTemplateKey?: string;
}

@Component({
  selector: 'app-input-prompt',
  templateUrl: './input-prompt.component.html',
  styleUrls: ['./input-prompt.component.scss'],
})
export class InputPromptComponent implements AfterViewInit {
  @Input()
  public subHeader: string;

  @Input()
  public message: string;

  @Input()
  public inputProps: InputProps;
  public inputModel: NgModel;

  @ViewChild('input')
  public input: any;

  public checked: boolean;

  constructor(
    public translate: TranslateService,
    private modalController: ModalController,
    private changeDetector: ChangeDetectorRef,
    private alertController: AlertController,
  ) {}

  ngAfterViewInit() {
    this.checked = this.inputProps ? this.inputProps.checkboxChecked : true;

    // Required to settle the value of a dynamic property in the template:
    this.changeDetector.detectChanges();
  }

  public checkboxChange(checked) {
    this.checked = checked;
  }

  public checkOkDisabled() {
    if (!this.inputProps) {
      return false;
    }

    if (this.inputProps.checkbox && !this.checked) {
      return false;
    }

    if (
      this.inputProps.inputRequired &&
      this.input &&
      this.input.value &&
      this.input.valid
    ) {
      return false;
    }

    if (
      this.inputProps.explanation &&
      this.inputProps.inputRequired === false
    ) {
      return false;
    }

    return true;
  }

  public submitConfirm() {
    if (!this.inputProps) {
      this.modalController.dismiss(null, null);
      return;
    }

    if (this.inputProps.checkbox && !this.checked) {
      this.modalController.dismiss(null, null);
      return;
    }

    if (
      this.inputProps.inputRequired &&
      this.input &&
      this.input.value &&
      this.input.valid
    ) {
      this.modalController.dismiss({ message: this.input.value }, null);
      return;
    }

    if (this.inputProps.isTemplated && this.inputProps.checkboxChecked) {
      this.modalController.dismiss(
        { messageTemplateKey: this.inputProps.messageTemplateKey },
        null,
      );
    }

    this.modalController.dismiss(null, null);
  }

  public async closeModal() {
    if (this.inputProps && this.inputProps.cancelAlertTranslationKey) {
      actionResult(
        this.alertController,
        this.translate,
        this.translate.instant(this.inputProps.cancelAlertTranslationKey),
      );
    }

    this.modalController.dismiss(null, 'cancel');
  }
}

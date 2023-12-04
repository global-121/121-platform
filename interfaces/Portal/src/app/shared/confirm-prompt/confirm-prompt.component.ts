import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { BulkActionId } from '../../models/bulk-actions.models';
import { PersonRow } from '../../models/person.model';
import { ExportDuplicatesPopupComponent } from '../../program/export-duplicates-popup/export-duplicates-popup.component';
import { SubmitPaymentPopupComponent } from '../../program/submit-payment-popup/submit-payment-popup.component';
import {
  DatetimePickerComponent,
  DatetimeProps,
} from '../datetime-picker/datetime-picker.component';
import {
  FilePickerPromptComponent,
  FilePickerProps,
} from '../file-picker-prompt/file-picker-prompt.component';
import { InputPromptComponent } from '../input-prompt/input-prompt.component';
import { MessageEditorComponent } from '../message-editor/message-editor.component';

export interface SubmitPaymentProps {
  programId: number;
  payment: number;
  referenceIds: string[];
  applicableCount?: number;
  sumPaymentAmountMultiplier?: number;
}

export interface DuplicateAttributesProps {
  attributes: string[];
  timestamp: string;
}

export interface InputProps {
  promptType?: PromptType;
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
  programId?: number;
  firstRegistration?: PersonRow;
}

export enum PromptType {
  reason = 'reason',
  actionWithMessage = 'actionWithMessage',
  actionWithoutMessage = 'actionWithoutMessage',
}

@Component({
  selector: 'app-confirm-prompt',
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
  public shape?: string;

  @Input()
  public inputProps: InputProps;

  @Input()
  public filePickerProps: FilePickerProps;

  @Input()
  public submitPaymentProps: SubmitPaymentProps;

  @Input()
  public duplicateAttributesProps?: string;

  @Input()
  public datetimeProps?: DatetimeProps;

  @Input()
  public action: BulkActionId;

  @Input()
  public class?: string;

  @Input()
  public bypassModalComponent = false;

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

    if (this.bypassModalComponent) {
      this.confirm.emit();
      return;
    }

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
    } else if (
      this.action === BulkActionId.doPayment &&
      this.submitPaymentProps
    ) {
      modal = await this.modalController.create({
        component: SubmitPaymentPopupComponent,
        componentProps: {
          subHeader: this.subHeader,
          message: this.message,
          submitPaymentProps: this.submitPaymentProps,
        },
      });
    } else if (this.duplicateAttributesProps) {
      modal = await this.modalController.create({
        component: ExportDuplicatesPopupComponent,
        componentProps: {
          subHeader: this.subHeader,
          message: this.message,
          duplicateAttributesProps: this.duplicateAttributesProps,
        },
      });
    } else if (this.datetimeProps) {
      modal = await this.modalController.create({
        component: DatetimePickerComponent,
        componentProps: {
          datetimeProps: this.datetimeProps,
        },
      });
    } else {
      modal = await this.modalController.create({
        component: [
          PromptType.actionWithMessage,
          PromptType.actionWithoutMessage,
        ].includes(this.inputProps?.promptType)
          ? MessageEditorComponent
          : InputPromptComponent,
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

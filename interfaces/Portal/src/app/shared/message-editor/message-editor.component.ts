import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  Input,
  ViewChild,
} from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Item } from '../../components/select-typeahead/select-typeahead.component';
import { PaTableAttribute } from '../../models/program.model';
import { ProgramsServiceApiService } from '../../services/programs-service-api.service';
import { TranslatableStringService } from '../../services/translatable-string.service';
import { actionResult } from '../action-result';
import {
  InputProps,
  PromptType,
} from '../confirm-prompt/confirm-prompt.component';

@Component({
  selector: 'app-message-editor',
  templateUrl: './message-editor.component.html',
  styleUrls: ['./message-editor.component.css'],
})
export class MessageEditorComponent implements AfterViewInit {
  @Input()
  public inputProps: InputProps;

  @Input()
  public subHeader: string;

  @Input()
  public message: string;

  @ViewChild('input')
  public input: any;

  public inputModel: string = '';

  public checked: boolean;

  public attributes: PaTableAttribute[];
  public attributeItems: Item[];
  public selectedAttribute: Item[];

  public preview: string;

  public promptTypeEnum = PromptType;

  public constructor(
    public translate: TranslateService,
    private translatableString: TranslatableStringService,
    private modalController: ModalController,
    private changeDetector: ChangeDetectorRef,
    private alertController: AlertController,
    private programsService: ProgramsServiceApiService,
  ) {}

  async ngAfterViewInit(): Promise<void> {
    this.checked = this.inputProps ? this.inputProps.checkboxChecked : true;
    this.preview = this.inputProps ? this.inputProps.templatedMessage : '';

    // Required to settle the value of a dynamic property in the template:
    this.changeDetector.detectChanges();

    this.attributes = await this.programsService.getPaTableAttributes(
      this.inputProps.programId,
      { includeFspQuestions: false },
    );

    if (this.attributes) {
      this.attributeItems = this.attributes.map((att) => ({
        name: att.name,
        label: att.shortLabel
          ? this.translatableString.get(att.shortLabel)
          : this.translatableString.get(att.label),
      }));
    }
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

  public checkOkDisabled() {
    if (!this.inputProps) {
      return false;
    }

    if (this.inputProps.checkbox && !this.checked) {
      return false;
    }

    if (this.inputProps.inputRequired && this.input && this.input.value) {
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

    if (this.inputProps.inputRequired && this.input && this.input.value) {
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

  public checkboxChange(checked) {
    this.checked = checked;
  }

  public async addPlaceholder() {
    const textArea = await this.input.getInputElement();
    textArea.setRangeText(`{{${this.selectedAttribute[0].name}}}`);
    this.inputModel = textArea.value;
    textArea.setSelectionRange(this.inputModel.length, this.inputModel.length);

    this.generatePreview(this.inputModel);
  }

  public generatePreview(input: string): void {
    if (!this.attributes) {
      this.preview = input;
    }

    let preview = input;

    this.attributes.forEach((att) => {
      preview = preview.replace(
        new RegExp(`{{${att.name}}}`, 'g'),
        this.inputProps?.previewRegistration?.[att.name] || '',
      );
    });

    this.preview = preview;
  }
}

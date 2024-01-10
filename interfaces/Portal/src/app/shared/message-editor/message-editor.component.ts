import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { MessageTemplate } from 'src/app/models/message.model';
import { Person } from 'src/app/models/person.model';
import { Item } from '../../components/select-typeahead/select-typeahead.component';
import { PaTableAttribute } from '../../models/program.model';
import { EnumService } from '../../services/enum.service';
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
export class MessageEditorComponent implements AfterViewInit, OnInit {
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

  private previewRegistration: Person;

  private defaulLanguage: string;

  public messageTemplates: MessageTemplate[];
  public templateTypes: any[];
  public selectedTemplateType: string;
  public customTemplateType = 'customTemplate';
  public showCustomTemplate: boolean = false;
  public showPreview: boolean = false;
  public showMessageTemplate: boolean = false;

  constructor(
    public translate: TranslateService,
    private translatableString: TranslatableStringService,
    private modalController: ModalController,
    private changeDetector: ChangeDetectorRef,
    private alertController: AlertController,
    private programsService: ProgramsServiceApiService,
    private enumService: EnumService,
  ) {}

  async ngOnInit(): Promise<void> {
    this.showMessageTemplate = this.message.includes('Send Message');
    this.messageTemplates =
      await this.programsService.getMessageTemplatesByProgram(
        this.inputProps.programId,
      );

    this.templateTypes = this.messageTemplates
      .filter((template) => template.isSendMessageTemplate)
      .map((template) => {
        return {
          type: template.type,
          label: this.translatableString.get(template.label),
        };
      })
      .filter(
        (template, index, self) =>
          index ===
          self.findIndex(
            (t) => t.type === template.type && t.label === template.label,
          ),
      );

    this.templateTypes.push({
      type: this.customTemplateType,
      label: 'Custom Message',
    });
    this.selectedTemplateType = this.customTemplateType;
    this.showCustomTemplate = true;
    this.showPreview = true;
    this.defaulLanguage = this.translate.getDefaultLang();
  }

  async ngAfterViewInit(): Promise<void> {
    this.checked = this.inputProps ? this.inputProps.checkboxChecked : true;
    this.preview = this.inputProps ? this.inputProps.templatedMessage : '';

    // Required to settle the value of a dynamic property in the template:
    this.changeDetector.detectChanges();

    this.attributes = await this.programsService.getPaTableAttributes(
      this.inputProps.programId,
      { includeFspQuestions: false, includeTemplateDefaultAttributes: true },
    );

    if (this.attributes) {
      this.attributeItems = this.attributes.map((att) => ({
        name: att.name,
        label: this.getLabel(att),
      }));
    }

    const getPeopleAffectedReponse =
      await this.programsService.getPeopleAffected(
        this.inputProps.programId,
        1,
        1,
        this.inputProps.previewReferenceId,
        null,
        this.attributes.map((att) => att.name),
      );
    this.previewRegistration = getPeopleAffectedReponse?.data?.[0];
  }

  private getLabel(attribute: PaTableAttribute): string {
    // Get label of attributes configured in the program
    const attributeShortLabel = this.translatableString.get(
      attribute.shortLabel,
    );
    if (attributeShortLabel) {
      return attributeShortLabel;
    }
    const attributLabel = this.translatableString.get(attribute.shortLabel);
    if (attributLabel) {
      return attributLabel;
    }
    // Get label of default attributes
    return this.translate.instant(
      `page.program.program-people-affected.column.${attribute.name}`,
    );
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

    if (
      this.selectedTemplateType !== this.customTemplateType &&
      this.selectedTemplateType !== undefined
    ) {
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

    if (
      this.selectedTemplateType !== this.customTemplateType &&
      this.selectedTemplateType !== undefined
    ) {
      this.modalController.dismiss(
        {
          message: this.preview,
          messageTemplateKey: this.selectedTemplateType,
        },
        null,
      );
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
    const placeholder = `{{${this.selectedAttribute[0].name}}}`;
    const textArea: HTMLTextAreaElement = await this.input.getInputElement();
    textArea.setRangeText(placeholder);
    this.inputModel = textArea.value;
    const cursorPosition = textArea.selectionEnd + placeholder.length;
    textArea.setSelectionRange(cursorPosition, cursorPosition);

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
        this.previewRegistration?.[att.name] || '',
      );
    });

    this.preview = preview;
  }

  public templateTypeChanged(): void {
    this.showCustomTemplate = false;
    this.showPreview = false;
  }

  public toggleCustomTemplate() {
    this.preview = '';

    if (this.selectedTemplateType !== this.customTemplateType) {
      const selectedTemplate = this.messageTemplates.find(
        (template) =>
          template.type === this.selectedTemplateType &&
          template.language === this.defaulLanguage,
      );

      this.preview = selectedTemplate ? selectedTemplate.message : '';
      this.showCustomTemplate = false;
      this.showPreview = true;
    } else {
      this.showCustomTemplate = true;
      this.showPreview = true;
    }
  }

  public getAvailableLanguages(): string[] {
    if (this.selectedTemplateType !== this.customTemplateType) {
      const templatesForType = this.messageTemplates.filter(
        (template) => template.type === this.selectedTemplateType,
      );

      const uniqueLanguages = [
        ...new Set(
          templatesForType.map((template) =>
            this.enumService.getEnumLabel(
              'preferredLanguage',
              template.language,
            ),
          ),
        ),
      ];

      return uniqueLanguages;
    }

    return [];
  }

  public getPreviewToDisplay(): string {
    if (this.selectedTemplateType !== this.customTemplateType) {
      const selectedTemplate = this.messageTemplates.find(
        (template) =>
          template.type === this.selectedTemplateType &&
          template.language === this.defaulLanguage,
      );

      return selectedTemplate ? selectedTemplate.message : '';
    }

    return this.preview;
  }
}

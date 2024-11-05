import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
} from '@angular/core';
import { NgModel } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { ProgramRegistrationAttributeOption } from 'src/app/models/program.model';
import { TranslatableStringService } from 'src/app/services/translatable-string.service';
import { RegistrationAttributeType } from '../../models/registration-attribute.model';
import {
  InputProps,
  PromptType,
} from '../../shared/confirm-prompt/confirm-prompt.component';
import { CheckAttributeInputUtils } from '../../shared/utils/check-attribute-input.utils';

@Component({
  selector: 'app-update-property-item',
  templateUrl: './update-property-item.component.html',
  styleUrls: ['./update-property-item.component.scss'],
})
export class UpdatePropertyItemComponent implements OnInit, OnChanges {
  @Input()
  public label: string;

  @Input()
  public explanation: string;

  @Input()
  public type: RegistrationAttributeType;

  @Input()
  public pattern: string;

  @Input()
  public isRequired: boolean;

  @Input()
  public value: string | string[];

  @Input()
  public placeholder: string | undefined;

  @Input()
  public isDisabled: boolean;

  @Input()
  public inProgress: boolean;

  @Input()
  public showSubmit = true;

  @Input()
  public options: ProgramRegistrationAttributeOption[] = null;

  @Input()
  public prop = '';

  @Output()
  updated: EventEmitter<{ value: string | boolean; reason: string }> =
    new EventEmitter<{ value: string | boolean; reason: string }>();

  public propertyModel: any | NgModel;

  public registrationAttributeType = RegistrationAttributeType;

  public reasonInputProps: InputProps;
  public reasonSubheader: string;

  constructor(
    private translate: TranslatableStringService,
    private translateService: TranslateService,
  ) {}

  ngOnInit() {
    this.setValue();
    this.reasonInputProps = {
      promptType: PromptType.reason,
      provideInput: true,
      inputRequired: true,
      explanation: this.translateService.instant(
        'page.program.program-people-affected.edit-person-affected-popup.reason-popup.explanation',
      ),
      inputConstraint: {
        length: 500,
        type: 'max',
      },
      titleTranslationKey:
        'page.program.program-people-affected.edit-person-affected-popup.reason-popup.subheader',
      okTranslationKey: 'common.save',
      cancelAlertTranslationKey:
        'page.program.program-people-affected.edit-person-affected-popup.reason-popup.unsaved-changes-explanation',
    };
  }

  ngOnChanges() {
    this.setValue();
  }

  private setValue() {
    if (this.type === RegistrationAttributeType.Enum && this.value == null) {
      this.value = '_null_'; // Ionic select does not support null properly so using '_null_' instead as a workaround
    }
    this.propertyModel = this.value;
  }

  public getTranslatedOptions() {
    let options = [...(this.options ?? [])];
    if (!this.isRequired && this.type === RegistrationAttributeType.Enum) {
      options = this.addEmptyOption(options);
    }
    const translatedOptions = options.map(({ option, label }) => ({
      option,
      label: this.translate.get(label),
    }));
    return translatedOptions;
  }

  private addEmptyOption(options: ProgramRegistrationAttributeOption[]) {
    if (options.length > 0 && options[0].option !== '_null_') {
      options.unshift({
        option: '_null_', // Ionic select does not support null properly so using '_null_' instead as a workaround
        label: { en: '-' }, // Add an string '-' for every language
      });
    }
    return options;
  }

  public doUpdate(reasonInput?: string) {
    if (this.type === 'date') {
      if (!this.isValidDate()) {
        alert(
          this.translateService.instant(
            'page.program.program-people-affected.edit-person-affected-popup.error-alert.invalid-date',
          ),
        );
        return;
      }
    }
    let updatedValue = this.propertyModel;

    if (
      this.type === RegistrationAttributeType.Enum &&
      this.propertyModel === '_null_'
    ) {
      updatedValue = null;
    }

    this.updated.emit({ value: updatedValue, reason: reasonInput });
  }

  private isValidDate(): boolean {
    if (
      !this.isRequired &&
      (this.propertyModel === '' || this.propertyModel == null)
    ) {
      return true;
    }
    const dateInput = this.propertyModel;

    const regex = /^\d{2}-\d{2}-\d{4}$/;

    if (dateInput.match(regex) === null) {
      return false;
    }
    const [day, month, year] = dateInput.split('-');

    const isoFormattedStr = `${year}-${month}-${day}`;

    const date = new Date(isoFormattedStr);

    const timestamp = date.getTime();

    if (typeof timestamp !== 'number' || Number.isNaN(timestamp)) {
      return false;
    }

    return date.toISOString().startsWith(isoFormattedStr);
  }

  public disableSaveButton(): boolean {
    return (
      // value is same as initially
      String(this.propertyModel) === String(this.value) ||
      // value is invalid
      !CheckAttributeInputUtils.isAttributeCorrectlyFilled(
        this.type,
        this.pattern,
        this.propertyModel,
        this.isRequired,
      )
    );
  }
}

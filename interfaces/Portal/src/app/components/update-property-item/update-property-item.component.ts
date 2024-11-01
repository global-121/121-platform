import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
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
export class UpdatePropertyItemComponent implements OnInit {
  @Input()
  public label: string;

  @Input()
  public explanation: string;

  @Input()
  public type: RegistrationAttributeType;

  @Input()
  public pattern: string;

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
    if (this.type === RegistrationAttributeType.MultiSelect) {
      this.value = this.value.toString().split(',');
    }
    this.propertyModel = this.value;

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

    this.updated.emit({ value: this.propertyModel, reason: reasonInput });
  }

  public translatedOptions() {
    return this.options.map(({ option, label }) => ({
      option,
      label: this.translate.get(label),
    }));
  }

  private isValidDate(): boolean {
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
      )
    );
  }
}

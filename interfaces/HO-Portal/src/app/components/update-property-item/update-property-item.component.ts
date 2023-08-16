import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgModel } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { ProgramQuestionOption } from 'src/app/models/program.model';
import { TranslatableStringService } from 'src/app/services/translatable-string.service';
import { AnswerType } from '../../models/fsp.model';
import { InputProps } from '../../shared/input-prompt/input-prompt.component';

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
  public type: AnswerType;

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
  public options: ProgramQuestionOption[] = null;

  @Input()
  public prop = '';

  @Output()
  updated: EventEmitter<{ value: string | boolean; reason: string }> =
    new EventEmitter<{ value: string | boolean; reason: string }>();

  public propertyModel: any | NgModel;

  public answerType = AnswerType;

  public reasonInputProps: InputProps;
  public reasonSubheader: string;

  constructor(
    private translate: TranslatableStringService,
    private translateService: TranslateService,
  ) {}

  ngOnInit() {
    if (this.type === AnswerType.MultiSelect) {
      this.value = this.value.toString().split(',');
    }
    this.propertyModel = this.value;

    this.reasonInputProps = {
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
    return String(this.propertyModel) === String(this.value);
  }
}

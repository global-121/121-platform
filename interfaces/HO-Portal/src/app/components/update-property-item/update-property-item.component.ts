import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgModel } from '@angular/forms';
import { ProgramQuestionOption } from 'src/app/models/program.model';
import { TranslatableStringService } from 'src/app/services/translatable-string.service';

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
  public type: string;

  @Input()
  public value: string;

  @Input()
  public placeholder: string;

  @Input()
  public isDisabled: boolean;

  @Input()
  public inProgress: boolean;

  @Input()
  public showSubmit = true;

  @Input()
  public options: ProgramQuestionOption[] = null;

  @Output()
  updated: EventEmitter<string | boolean> = new EventEmitter<
    string | boolean
  >();

  public propertyModel: any | NgModel;

  constructor(private translate: TranslatableStringService) {}

  ngOnInit() {
    this.propertyModel = this.value;
  }

  public doUpdate() {
    if (this.type === 'date') {
      if (!this.isValidDate()) {
        alert(
          this.translate.get(
            'page.program.program-people-affected.edit-person-affected-popup.error-alert.invalid-date',
          ),
        );
        return;
      }
    }

    this.updated.emit(this.propertyModel);
  }

  public translatedOptions() {
    return this.options.map(({ option, label }) => {
      return {
        option,
        label: this.translate.get(label),
      };
    });
  }

  private isValidDate = (): boolean => {
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
  };
}

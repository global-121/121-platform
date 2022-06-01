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
}

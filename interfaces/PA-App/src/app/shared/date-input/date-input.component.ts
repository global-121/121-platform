import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { NgModel } from '@angular/forms';

@Component({
  selector: 'date-input',
  templateUrl: './date-input.component.html',
  styleUrls: ['./date-input.component.scss'],
})
export class DateInputComponent {
  @ViewChild('dateInput', { static: true })
  public dateInput: any;

  @Input()
  public name: string;

  @Input()
  public ngModel: NgModel;

  @Input()
  public value: string;

  @Input()
  public disabled: boolean;

  @Input()
  public required: boolean;

  @Input()
  public isValid: boolean;

  @Output()
  public isValidChange = new EventEmitter<boolean>();

  constructor() {}

  private setValidity(state: boolean) {
    this.isValid = state;
    this.isValidChange.emit(state);
  }

  public async onChange() {
    // 'export' the value of the input-ELEMENT to be used as value of this COMPONENT
    this.value = this.dateInput.value;

    const nativeInput = await this.dateInput.getInputElement();
    const nativeIsValid = nativeInput.checkValidity();

    this.setValidity(nativeIsValid);
  }
}

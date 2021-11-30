import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { NgModel } from '@angular/forms';

@Component({
  selector: 'numeric-input',
  templateUrl: './numeric-input.component.html',
  styleUrls: ['./numeric-input.component.scss'],
})
export class NumericInputComponent {
  @ViewChild('numericInput', { static: false })
  public numericInput: any;

  @Input()
  public name: string;

  @Input()
  public ngModel: NgModel;

  @Input()
  public value: string;

  @Input()
  public required: boolean;

  @Input()
  public autocomplete: string;

  @Input()
  public placeholder: string;

  @Input()
  public pattern: string;

  @Input()
  public disabled: boolean;

  @Input()
  public isValid: boolean;
  @Output()
  public isValidChange = new EventEmitter<boolean>();

  constructor() {}

  public async onChange() {
    // 'export' the value of the input-ELEMENT to be used as value of this COMPONENT
    this.value = this.numericInput.value;

    const nativeInput = await this.numericInput.getInputElement();
    const nativeIsValid = nativeInput.checkValidity();

    this.setValidity(nativeIsValid);
  }

  private setValidity(state: boolean, emit = true) {
    this.isValid = state;
    if (emit) {
      this.isValidChange.emit(state);
    }
  }
}

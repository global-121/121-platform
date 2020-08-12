import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { NgModel } from '@angular/forms';

@Component({
  selector: 'email-input',
  templateUrl: './email-input.component.html',
  styleUrls: ['./email-input.component.scss'],
})
export class EmailInputComponent {
  @ViewChild('emailInput')
  public emailInput: any;

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
  public disabled: boolean;

  @Input()
  public isValid: boolean;
  @Output()
  public isValidChange = new EventEmitter<boolean>();

  constructor() { }

  public async onChange() {
    this.value = this.emailInput.value;
    console.log('this.emailInput.value: ', this.emailInput.value);

    const nativeInput = await this.emailInput.getInputElement();
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

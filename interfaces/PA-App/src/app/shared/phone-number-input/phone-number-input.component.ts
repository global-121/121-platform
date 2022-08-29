import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { NgModel } from '@angular/forms';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';

@Component({
  selector: 'phone-number-input',
  templateUrl: './phone-number-input.component.html',
  styleUrls: ['./phone-number-input.component.scss'],
})
export class PhoneNumberInputComponent {
  @ViewChild('telInput')
  public telInput: any;

  @Input()
  public name: string;

  @Input()
  public ngModel: NgModel;

  @Input()
  public value: string;

  @Input()
  public placeholder: string | undefined;

  @Input()
  public disabled: boolean;

  @Input()
  public required: boolean;

  @Input()
  public isValid: boolean;
  @Output()
  public isValidChange = new EventEmitter<boolean>();

  private defaultValidity = true;

  constructor(private programService: ProgramsServiceApiService) {}

  private setValidity(state: boolean) {
    this.isValid = state;
    this.isValidChange.emit(state);
  }

  public async onChange() {
    // 'export' the value of the input-ELEMENT to be used as value of this COMPONENT
    this.value = this.telInput.value;

    if (this.telInput.disabled) {
      return;
    }

    const nativeInput = await this.telInput.getInputElement();
    const nativeIsValid = nativeInput.checkValidity();

    if (!nativeIsValid) {
      this.setValidity(nativeIsValid);
      return;
    }

    const customIsValid = await this.checkValidityOnline();
    this.setValidity(customIsValid);
  }

  private async checkValidityOnline() {
    if (!window.navigator.onLine) {
      return this.defaultValidity;
    }

    const phoneNumber = this.telInput.value;
    let isValid: boolean;

    await this.programService.lookupPhoneNumber(phoneNumber).then(
      (result) => {
        // Only if there is a valid result, use that:
        if (typeof result.result !== 'undefined') {
          isValid = result.result;
          return;
        }
        // Otherwise, use the default value:
        isValid = this.defaultValidity;
      },
      (error) => {
        console.log('lookupPhoneNumber error: ', error);
        // Allow any input as valid in case of errors during lookup
        isValid = this.defaultValidity;
      },
    );

    return isValid;
  }
}

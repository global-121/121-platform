import { Component, Input, Output, ViewChild, EventEmitter } from '@angular/core';
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
  public value: string;

  @Input()
  public disabled: boolean;

  @Input()
  public isValid: boolean;
  @Output()
  public isValidChange = new EventEmitter<boolean>();

  private initialChecked = false;

  constructor(
    private programService: ProgramsServiceApiService,
  ) { }

  private setValidity(state: boolean, emit = true) {
    this.isValid = state;
    if (emit) {
      this.isValidChange.emit(state);
    }
  }

  public async onChange() {
    // 'export' the value of the input-ELEMENT to be used as value of this COMPONENT
    this.value = this.telInput.value;

    const nativeInput = await this.telInput.getInputElement();
    const nativeIsValid = nativeInput.checkValidity();

    if (!nativeIsValid) {
      this.setValidity(false, this.initialChecked);
      return;
    }

    // Only start emitting validity-states when the first check is passed once:
    this.initialChecked = true;

    const customIsValid = await this.checkValidityOnline();
    this.setValidity(customIsValid);
  }

  private async checkValidityOnline() {
    const phoneNumber = this.telInput.value;
    let isValid: boolean;

    await this.programService.lookupPhoneNumber(phoneNumber).then(
      (result) => {
        isValid = (typeof result.result !== 'undefined') ? result.result : false;
      },
      (error) => {
        console.log('error: ', error.error);
        isValid = false;
      }
    );

    return isValid;
  }
}

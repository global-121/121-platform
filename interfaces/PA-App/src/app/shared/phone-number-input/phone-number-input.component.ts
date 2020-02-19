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

  constructor(
    private programService: ProgramsServiceApiService,
  ) { }

  private setValidity(state: boolean) {
    this.isValid = state;
    this.isValidChange.emit(state);
  }

  public async onChange() {
    const nativeInput = await this.telInput.getInputElement();
    const nativeIsValid = nativeInput.checkValidity();

    if (!nativeIsValid) {
      this.setValidity(false);
      return;
    }

    const customIsValid = await this.checkValidity();
    this.setValidity(customIsValid);
  }

  private async checkValidity() {
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

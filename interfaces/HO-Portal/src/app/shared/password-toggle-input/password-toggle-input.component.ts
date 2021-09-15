import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'password-toggle-input',
  templateUrl: './password-toggle-input.component.html',
  styleUrls: ['./password-toggle-input.component.scss'],
})
export class PasswordToggleInputComponent {
  @ViewChild('passwordInput', { static: true })
  public passwordInput: any;

  @Input()
  public name: string;

  // Pass through the (ng)model:
  @Input()
  public ngModel: any;

  @Input()
  public disabled: boolean;

  @Input()
  public isValid: boolean;
  @Output()
  public isValidChange = new EventEmitter<boolean>();

  @Input()
  public autocomplete: string;

  @Input()
  public minLength: number;

  @Input()
  public label: string;

  @Input()
  public labelShow = 'Show password';

  @Input()
  public labelHide = 'Hide password';

  public inputType: 'password' | 'text' = 'password';

  constructor() {}

  isPassword() {
    return this.inputType === 'password';
  }

  toggleInputType() {
    this.inputType = this.isPassword() ? 'text' : 'password';
  }

  private setValidity(state: boolean, emit = true) {
    this.isValid = state;
    if (emit) {
      this.isValidChange.emit(state);
    }
  }

  public async onChange() {
    const nativeInput = await this.passwordInput.getInputElement();
    const nativeIsValid = nativeInput.checkValidity();
    this.setValidity(nativeIsValid);
  }
}

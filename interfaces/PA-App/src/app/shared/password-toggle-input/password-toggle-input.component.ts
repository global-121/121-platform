import { Component, Input } from '@angular/core';

@Component({
  selector: 'password-toggle-input',
  templateUrl: './password-toggle-input.component.html',
  styleUrls: ['./password-toggle-input.component.scss'],
})
export class PasswordToggleInputComponent {
  @Input()
  public name: string;

  // Pass through the (ng)model:
  @Input()
  public ngModel: any;

  @Input()
  public disabled: boolean;

  @Input()
  public autocomplete: string;

  @Input()
  public label: string;

  @Input()
  public labelShow = 'Show password';

  @Input()
  public labelHide = 'Hide password';

  public inputType: 'password'|'text' = 'password';

  constructor() {}

  isPassword() {
    return (this.inputType === 'password');
  }

  toggleInputType() {
    this.inputType = this.isPassword() ? 'text' : 'password';
  }
}

import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';

@Component({
  selector: 'app-user-settings',
  standalone: true,
  imports: [
    PageLayoutComponent,
    PasswordModule,
    ButtonModule,
    ReactiveFormsModule,
  ],
  templateUrl: './user-settings.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserSettingsComponent {
  changePasswordForm = new FormGroup(
    {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      currentPassword: new FormControl('', [Validators.required]),
      // eslint-disable-next-line @typescript-eslint/unbound-method
      newPassword: new FormControl('', [Validators.required]),
      // eslint-disable-next-line @typescript-eslint/unbound-method
      confirmPassword: new FormControl('', [Validators.required]),
    },
    {
      validators: this.matchValidator('password', 'confirmPassword'),
    },
  );

  matchValidator(
    controlName: string,
    matchingControlName: string,
  ): ValidatorFn {
    return (abstractControl: AbstractControl) => {
      const control = abstractControl.get(controlName);
      const matchingControl = abstractControl.get(matchingControlName);

      if (
        matchingControl?.errors &&
        !matchingControl.errors.confirmedValidator
      ) {
        return null;
      }

      if (control?.value !== matchingControl?.value) {
        const error = { confirmedValidator: 'Passwords do not match.' };
        matchingControl?.setErrors(error);
        return error;
      } else {
        matchingControl?.setErrors(null);
        return null;
      }
    };
  }

  changePasswordFormSubmitted = signal(false);

  onChangePassword() {
    this.changePasswordFormSubmitted.set(true);

    if (this.changePasswordForm.invalid) {
      console.log('🚀 ~ UserSettingsComponent ~ onChangePassword ~ ostiasa:');

      console.log(
        '🚀 ~ UserSettingsComponent ~ onChangePassword ~ this.changePasswordForm:',
        this.changePasswordForm,
      );
      this.changePasswordFormSubmitted.set(false);
      return;
    }

    const { currentPassword, newPassword, confirmPassword } =
      this.changePasswordForm.value;
    console.log(
      '🚀 ~ UserSettingsComponent ~ onChangePassword ~ currentPassword:',
      currentPassword,
    );
    console.log(
      '🚀 ~ UserSettingsComponent ~ onChangePassword ~ newPassword:',
      newPassword,
    );
    console.log(
      '🚀 ~ UserSettingsComponent ~ onChangePassword ~ confirmPassword:',
      confirmPassword,
    );
  }
}

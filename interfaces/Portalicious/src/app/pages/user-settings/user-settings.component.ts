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
  currentPasswordValidator: ValidatorFn = (
    control: AbstractControl,
  ): null | ValidationErrors => {
    const currentPassword = control.get('currentPassword');

    const requiredMessage = $localize`This field is required.`;

    const errors: {
      required: null | string;

    } = {
      required: null,

    };

    if (!currentPassword) {
      return errors;
    }

    const requiredCondition = String(currentPassword.value).trim() === '';

    errors.required = requiredCondition ? requiredMessage : null;

    currentPassword.setErrors(
      Object.values(errors).some((e) => e) ? errors : null,
    );

    return Object.values(errors).some((e) => e) ? errors : null;
  };
  newPasswordValidator: ValidatorFn = (
    control: AbstractControl,
  ): null | ValidationErrors => {
    const newPassword = control.get('newPassword');
    const currentPassword = control.get('currentPassword');

    const requiredMessage = $localize`This field is required.`;
    const newEqualsCurrentMessage = $localize`The new password must be different from the current password.`;
    const minlengthMessage = $localize`The new password must be at least 8 characters long.`;

    const errors: {
      required: null | string;
      newEqualsCurrent: null | string;
      minlength: null | string;
    } = {
      required: null,
      newEqualsCurrent: null,
      minlength: null,
    };

    if (!newPassword || !currentPassword) {
      return null
    }

    const requiredCondition = String(newPassword.value).trim() === ''

    const newEqualsCurrentErrorCondition =
      newPassword.dirty &&
      currentPassword.dirty &&
      newPassword.value === currentPassword.value;

    const minlengthErrorCondition =
      newPassword.dirty && String(newPassword.value).length < 8;

      errors.required = requiredCondition ? requiredMessage : null;

    errors.newEqualsCurrent = newEqualsCurrentErrorCondition
      ? newEqualsCurrentMessage
      : null;

    errors.minlength = minlengthErrorCondition ? minlengthMessage : null;

    newPassword.setErrors(Object.values(errors).some((e) => e) ? errors : null);

    return Object.values(errors).some((e) => e) ? errors : null;
  };
  confirmPasswordValidator: ValidatorFn = (
    control: AbstractControl,
  ): null | ValidationErrors => {
    const confirmPassword = control.get('confirmPassword');
    const newPassword = control.get('newPassword');

    const requiredMessage = $localize`This field is required.`;
    const confirmDifferentFromNewMessage = $localize`The confirm password must be equal to the new password.`;

    const errors: {
      required: null | string;
      confirmDifferentFromNew: null | string;
    } = {
      required: null,
      confirmDifferentFromNew: null,
    };

    if (!confirmPassword || !newPassword) {
      return errors;
    }

    const requiredCondition = String(confirmPassword.value).trim() === '';

    const confirmDifferentFromNewErrorCondition =
      confirmPassword.dirty &&
      newPassword.dirty &&
      confirmPassword.value !== newPassword.value;

      errors.required = requiredCondition ? requiredMessage : null;

    errors.confirmDifferentFromNew = confirmDifferentFromNewErrorCondition
      ? confirmDifferentFromNewMessage
      : null;

    confirmPassword.setErrors(
      Object.values(errors).some((e) => e) ? errors : null,
    );

    return Object.values(errors).some((e) => e) ? errors : null;
  };
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

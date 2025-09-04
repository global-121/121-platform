import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';

import { injectMutation } from '@tanstack/angular-query-experimental';
import { AutoFocus } from 'primeng/autofocus';
import { PasswordModule } from 'primeng/password';

import { FormDefaultComponent } from '~/components/form-default/form-default.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { AuthService } from '~/services/auth.service';
import { ToastService } from '~/services/toast.service';
import { generateFieldErrors } from '~/utils/form-validation';

const newPasswordValidator: ValidatorFn = (
  control: AbstractControl<ChangePasswordFormGroup>,
): null | ValidationErrors => {
  const currentPassword = control.get('currentPassword');
  const newPassword = control.get('newPassword');
  return newPassword &&
    currentPassword &&
    newPassword.value === currentPassword.value
    ? { newPasswordIsNotDifferent: true }
    : null;
};

const confirmPasswordValidator: ValidatorFn = (
  control: AbstractControl<ChangePasswordFormGroup>,
): null | ValidationErrors => {
  const newPassword = control.get('newPassword');
  const confirmPassword = control.get('confirmPassword');
  return newPassword &&
    confirmPassword &&
    newPassword.value !== confirmPassword.value
    ? { confirmPasswordDoesNotMatch: true }
    : null;
};

type ChangePasswordFormGroup =
  (typeof BasicAuthChangePasswordComponent)['prototype']['formGroup'];

@Component({
  selector: 'app-basic-auth-change-password',
  imports: [
    AutoFocus,
    PasswordModule,
    ReactiveFormsModule,
    FormDefaultComponent,
    FormFieldWrapperComponent,
  ],
  providers: [ToastService],
  templateUrl: './basic-auth.change-password.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicAuthChangePasswordComponent {
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  formGroup = new FormGroup(
    {
      currentPassword: new FormControl('', {
        nonNullable: true,
        // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
        validators: [Validators.required],
      }),
      newPassword: new FormControl('', {
        nonNullable: true,
        validators: [
          // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
          Validators.required,
          Validators.minLength(8),
        ],
      }),
      confirmPassword: new FormControl('', {
        nonNullable: true,
        // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
        validators: [Validators.required],
      }),
    },
    { validators: [newPasswordValidator, confirmPasswordValidator] },
  );

  formFieldErrors = generateFieldErrors<ChangePasswordFormGroup>(
    this.formGroup,
    {
      currentPassword: (control) =>
        control.errors?.required
          ? $localize`:@@generic-required-field:This field is required.`
          : undefined,
      newPassword: (control) => {
        if (control.errors?.required) {
          return $localize`:@@generic-required-field:This field is required.`;
        }
        if (control.errors?.minlength) {
          return $localize`The new password must be at least 8 characters long.`;
        }
        if (this.formGroup.hasError('newPasswordIsNotDifferent')) {
          return $localize`The new password must be different from the current password.`;
        }
        return;
      },
      confirmPassword: (control) => {
        if (control.errors?.required) {
          return $localize`:@@generic-required-field:This field is required.`;
        }
        if (this.formGroup.hasError('confirmPasswordDoesNotMatch')) {
          return $localize`The confirm password must be equal to the new password.`;
        }
        return;
      },
    },
  );

  changePasswordMutation = injectMutation(() => ({
    mutationFn: ({
      currentPassword,
      newPassword,
    }: ReturnType<ChangePasswordFormGroup['getRawValue']>) =>
      this.authService.changePassword({
        password: currentPassword,
        newPassword,
      }),
    onSuccess: () => {
      this.formGroup.reset();
      this.toastService.showToast({
        detail: $localize`Your password was successfully changed.`,
      });
    },
  }));
}

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
import { AutoFocusModule } from 'primeng/autofocus';
import { CardModule } from 'primeng/card';
import { PasswordModule } from 'primeng/password';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { FormDefaultComponent } from '~/components/form/form-default.component';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';
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
  (typeof ChangePasswordComponent)['prototype']['formGroup'];

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    PageLayoutComponent,
    AutoFocusModule,
    PasswordModule,
    ReactiveFormsModule,
    FormDefaultComponent,
    FormFieldWrapperComponent,
    CardModule,
  ],
  providers: [ToastService],
  templateUrl: './change-password.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangePasswordComponent {
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  formGroup = new FormGroup(
    {
      currentPassword: new FormControl('', {
        nonNullable: true,
        // eslint-disable-next-line @typescript-eslint/unbound-method
        validators: [Validators.required],
      }),
      newPassword: new FormControl('', {
        nonNullable: true,
        validators: [
          // eslint-disable-next-line @typescript-eslint/unbound-method
          Validators.required,
          Validators.minLength(8),
        ],
      }),
      confirmPassword: new FormControl('', {
        nonNullable: true,
        // eslint-disable-next-line @typescript-eslint/unbound-method
        validators: [Validators.required],
      }),
    },
    { validators: [newPasswordValidator, confirmPasswordValidator] },
  );

  formFieldErrors = generateFieldErrors<ChangePasswordFormGroup>(
    this.formGroup,
    {
      currentPassword: (control) => {
        return control.errors?.required
          ? $localize`:@@generic-required-field:This field is required.`
          : undefined;
      },
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
    }: Required<ChangePasswordFormGroup['value']>) =>
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

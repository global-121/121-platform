import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { injectMutation } from '@tanstack/angular-query-experimental';
import {
  DynamicFormComponent,
  DynamicFormField,
} from '~/components/dynamic-form/dynamic-form.component';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';
import { AuthService } from '~/services/auth.service';
import { ToastService } from '~/services/toast.service';

const newPasswordValidator: ValidatorFn = (
  control: AbstractControl,
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
  control: AbstractControl,
): null | ValidationErrors => {
  const newPassword = control.get('newPassword');
  const confirmPassword = control.get('confirmPassword');
  return newPassword &&
    confirmPassword &&
    newPassword.value !== confirmPassword.value
    ? { confirmPasswordDoesNotMatch: true }
    : null;
};

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [PageLayoutComponent, DynamicFormComponent],
  providers: [ToastService],
  templateUrl: './change-password.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangePasswordComponent {
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  changePasswordForm = new FormGroup(
    {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      currentPassword: new FormControl('', Validators.required),
      newPassword: new FormControl('', [
        // eslint-disable-next-line @typescript-eslint/unbound-method
        Validators.required,
        Validators.minLength(8),
      ]),
      // eslint-disable-next-line @typescript-eslint/unbound-method
      confirmPassword: new FormControl('', Validators.required),
    },
    { validators: [newPasswordValidator, confirmPasswordValidator] },
  );

  changePasswordFields: DynamicFormField[] = [
    {
      controlName: 'currentPassword',
      label: $localize`Current Password`,
      type: 'password',
      autocomplete: 'current-password',
      autoFocus: true,
      validationMessage: (form: FormGroup) => {
        if (form.controls.currentPassword.errors?.required) {
          return $localize`:@@generic-required-field:This field is required.`;
        }

        return null;
      },
    },
    {
      controlName: 'newPassword',
      label: $localize`New Password`,
      type: 'password',
      autocomplete: 'new-password',
      validationMessage: (form: FormGroup) => {
        if (form.controls.newPassword.errors?.required) {
          return $localize`:@@generic-required-field:This field is required.`;
        }

        if (form.controls.newPassword.errors?.minlength) {
          return $localize`The new password must be at least 8 characters long.`;
        }

        if (form.hasError('newPasswordIsNotDifferent')) {
          return $localize`The new password must be different from the current password.`;
        }

        return null;
      },
    },
    {
      controlName: 'confirmPassword',
      label: $localize`Confirm Password`,
      type: 'password',
      validationMessage: (form: FormGroup) => {
        if (form.controls.confirmPassword.errors?.required) {
          return $localize`:@@generic-required-field:This field is required.`;
        }

        if (form.hasError('confirmPasswordDoesNotMatch')) {
          return $localize`The confirm password must be equal to the new password.`;
        }

        return null;
      },
    },
  ];

  changePasswordMutation = injectMutation(() => ({
    mutationFn: ({
      password,
      newPassword,
    }: {
      password: string;
      newPassword: string;
    }) => this.authService.changePassword({ password, newPassword }),
    onSuccess: () => {
      this.changePasswordForm.reset();
      this.toastService.showToast({
        detail: $localize`Your password was successfully changed.`,
      });
    },
  }));

  changePasswordFormError = computed(() => {
    if (!this.changePasswordMutation.isError()) {
      return;
    }
    return this.changePasswordMutation.failureReason()?.message;
  });

  onChangePassword() {
    const { currentPassword, newPassword, confirmPassword } =
      this.changePasswordForm.value;

    if (
      !this.changePasswordForm.valid ||
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      return;
    }

    this.changePasswordMutation.mutate({
      password: currentPassword,
      newPassword,
    });
  }
}

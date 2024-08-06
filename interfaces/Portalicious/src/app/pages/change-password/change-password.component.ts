import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
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
import { ButtonModule } from 'primeng/button';
import { MessagesModule } from 'primeng/messages';
import { PasswordModule } from 'primeng/password';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { FormErrorComponent } from '~/components/form-error/form-error.component';
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
  imports: [
    PageLayoutComponent,
    PasswordModule,
    ButtonModule,
    ReactiveFormsModule,
    FormErrorComponent,
    ProgressSpinnerModule,
    MessagesModule,
  ],
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
      /* eslint-disable-next-line @typescript-eslint/unbound-method */
      currentPassword: new FormControl('', Validators.required),
      newPassword: new FormControl('', [
        /* eslint-disable-next-line @typescript-eslint/unbound-method */
        Validators.required,
        Validators.minLength(8),
      ]),
      /* eslint-disable-next-line @typescript-eslint/unbound-method */
      confirmPassword: new FormControl('', Validators.required),
    },
    {
      validators: [newPasswordValidator, confirmPasswordValidator],
    },
  );

  // This should only be used to show the error messages when the form is submitted.
  // That is because we do not want to use "disabled" buttons in our forms, for accessibility reasons,
  // and we want to show the error messages when the form is submitted with errors.
  changePasswordFormSubmitted = signal(false);

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
      this.changePasswordFormSubmitted.set(false);
      this.toastService.showToast({
        detail: $localize`Your password was successfully changed.`,
      });
    },
  }));

  onChangePassword() {
    this.changePasswordFormSubmitted.set(true);

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

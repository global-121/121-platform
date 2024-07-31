import { JsonPipe } from '@angular/common';
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
import { ToastModule } from 'primeng/toast';
import { FormErrorComponent } from '~/components/form-error/form-error.component';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';
import { AuthService } from '~/services/auth.service';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-user-settings',
  standalone: true,
  imports: [
    PageLayoutComponent,
    PasswordModule,
    ButtonModule,
    ReactiveFormsModule,
    FormErrorComponent,
    ToastModule,
    ProgressSpinnerModule,
    MessagesModule,
    JsonPipe,
  ],
  providers: [ToastService],
  templateUrl: './user-settings.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserSettingsComponent {
  private authService = inject(AuthService);

  public changePasswordError = signal<null | string>(null);

  newPasswordValidator: ValidatorFn = (
    control: AbstractControl,
  ): null | ValidationErrors => {
    const newPassword = control.get('newPassword');
    const currentPassword = control.get('currentPassword');

    if (newPassword?.errors?.newEqualsCurrent) {
      delete newPassword.errors.newEqualsCurrent;
    }

    if (
      !newPassword?.hasError('required') &&
      !newPassword?.hasError('minlength')
    ) {
      newPassword?.setErrors(null);
    }

    let customErrors: { newEqualsCurrent?: true } | null = null;

    const newEqualsCurrentErrorCondition =
      newPassword?.dirty &&
      currentPassword?.dirty &&
      String(newPassword.value) === String(currentPassword.value);

    if (newEqualsCurrentErrorCondition) {
      customErrors = { newEqualsCurrent: true };
    }

    const combinedErrors =
      newPassword?.errors || customErrors
        ? { ...newPassword?.errors, ...customErrors }
        : null;

    newPassword?.setErrors(combinedErrors);
    return combinedErrors;
  };

  confirmPasswordValidator: ValidatorFn = (
    control: AbstractControl,
  ): null | ValidationErrors => {
    const confirmPassword = control.get('confirmPassword');
    const newPassword = control.get('newPassword');

    if (confirmPassword?.errors?.confirmDifferentFromNew) {
      delete confirmPassword.errors.confirmDifferentFromNew;
    }

    if (!confirmPassword?.hasError('required')) {
      confirmPassword?.setErrors(null);
    }

    let customErrors: {
      confirmDifferentFromNew?: true;
    } | null = null;

    const confirmDifferentFromNewErrorCondition =
      confirmPassword?.dirty &&
      newPassword?.dirty &&
      confirmPassword.value !== newPassword.value;

    if (confirmDifferentFromNewErrorCondition) {
      customErrors = { confirmDifferentFromNew: true };
    }

    const combinedErrors =
      confirmPassword?.errors || customErrors
        ? { ...confirmPassword?.errors, ...customErrors }
        : null;

    confirmPassword?.setErrors(combinedErrors);
    return combinedErrors;
  };

  /* eslint-disable-next-line @typescript-eslint/unbound-method */
  private currentPasswordFormControl = new FormControl('', Validators.required);

  private newPasswordFormControl = new FormControl('', [
    /* eslint-disable-next-line @typescript-eslint/unbound-method */
    Validators.required,

    Validators.minLength(8),
  ]);
  /* eslint-disable-next-line @typescript-eslint/unbound-method */
  private confirmPasswordFormControl = new FormControl('', Validators.required);

  changePasswordForm = new FormGroup(
    {
      currentPassword: this.currentPasswordFormControl,
      newPassword: this.newPasswordFormControl,
      confirmPassword: this.confirmPasswordFormControl,
    },
    {
      validators: [this.newPasswordValidator, this.confirmPasswordValidator],
    },
  );

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
    },
    onError: (error) => {
      this.changePasswordError.set(error.message);
      this.changePasswordForm.reset();
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
      this.changePasswordFormSubmitted.set(false);
      return;
    }

    this.changePasswordMutation.mutate({
      password: currentPassword,
      newPassword,
    });
  }
}

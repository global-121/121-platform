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

  public changePasswordError = signal<string | null>(null);

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
      currentPassword: new FormControl('', Validators.required),
      newPassword: new FormControl('', Validators.required),
      confirmPassword: new FormControl('',Validators.required),
    },
    {
      validators: [
        this.currentPasswordValidator,
        this.newPasswordValidator,
        this.confirmPasswordValidator,
      ]}
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
    }
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

  getErrors(errors: Record<string, string>): string[] {
    return Object.values(errors).filter((error) => error);
  }
}

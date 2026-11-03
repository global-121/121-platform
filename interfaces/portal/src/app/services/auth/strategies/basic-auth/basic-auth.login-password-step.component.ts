import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  output,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { injectMutation } from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';

import { FormDefaultComponent } from '~/components/form-default/form-default.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { AuthService } from '~/services/auth.service';
import { LoginMethod } from '~/services/auth/login-method.enum';
import { generateFieldErrors } from '~/utils/form-validation';

type LoginPasswordStepFormGroup =
  (typeof BasicAuthLoginPasswordStepComponent)['prototype']['formGroup'];

@Component({
  selector: 'app-basic-auth-login-password-step',
  imports: [
    InputTextModule,
    PasswordModule,
    ButtonModule,
    FormDefaultComponent,
    ReactiveFormsModule,
    FormFieldWrapperComponent,
  ],
  templateUrl: './basic-auth.login-password-step.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicAuthLoginPasswordStepComponent implements OnInit {
  private authService = inject(AuthService);
  readonly email = input.required<string>();
  readonly returnUrl = input<string | undefined>(undefined);
  readonly otpInstead = output<{ email: string }>();

  passWordResetSubject = `Request Password reset for 121 Platform: ${location.host}`; // NOTE: Not localized/translated, it's used by support-team only

  formGroup = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
      validators: [Validators.required],
    }),
  });

  formFieldErrors = generateFieldErrors(this.formGroup);

  loginMutation = injectMutation(() => ({
    mutationFn: ({
      email,
      password,
    }: ReturnType<LoginPasswordStepFormGroup['getRawValue']>) =>
      this.authService.login(
        { method: LoginMethod.password, username: email, password },
        this.returnUrl(),
      ),
  }));

  ngOnInit(): void {
    this.formGroup.patchValue({ email: this.email() });
  }
}

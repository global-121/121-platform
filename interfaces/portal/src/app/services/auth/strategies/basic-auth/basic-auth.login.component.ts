import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { injectMutation } from '@tanstack/angular-query-experimental';
import { AutoFocus } from 'primeng/autofocus';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';

import { FormDefaultComponent } from '~/components/form-default/form-default.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { AuthService } from '~/services/auth.service';
import { generateFieldErrors } from '~/utils/form-validation';

type LoginFormGroup =
  (typeof BasicAuthLoginComponent)['prototype']['formGroup'];

@Component({
  selector: 'app-basic-auth-login',
  imports: [
    InputTextModule,
    PasswordModule,
    AutoFocus,
    FormDefaultComponent,
    ReactiveFormsModule,
    FormFieldWrapperComponent,
  ],
  templateUrl: './basic-auth.login.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicAuthLoginComponent {
  private authService = inject(AuthService);
  readonly returnUrl = input<string | undefined>(undefined);

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
    }: ReturnType<LoginFormGroup['getRawValue']>) =>
      this.authService.login({ username: email, password }, this.returnUrl()),
  }));
}

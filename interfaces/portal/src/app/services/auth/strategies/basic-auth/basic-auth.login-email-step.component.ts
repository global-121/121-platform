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
import { AutoFocus } from 'primeng/autofocus';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

import { FormDefaultComponent } from '~/components/form-default/form-default.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { UserApiService } from '~/domains/user/user.api.service';
import { generateFieldErrors } from '~/utils/form-validation';

type LoginEmailStepFormGroup =
  (typeof BasicAuthLoginEmailStepComponent)['prototype']['formGroup'];

@Component({
  selector: 'app-basic-auth-login-email-step',
  imports: [
    InputTextModule,
    ButtonModule,
    AutoFocus,
    FormDefaultComponent,
    ReactiveFormsModule,
    FormFieldWrapperComponent,
  ],
  templateUrl: './basic-auth.login-email-step.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicAuthLoginEmailStepComponent implements OnInit {
  private userApiService = inject(UserApiService);
  readonly email = input.required<string>();
  readonly otpRequested = output<string>();
  readonly passwordInstead = output<string>();

  formGroup = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
      validators: [Validators.required, Validators.email],
    }),
  });

  formFieldErrors = generateFieldErrors(this.formGroup);

  requestOtpMutation = injectMutation(() => ({
    mutationFn: ({
      email,
    }: ReturnType<LoginEmailStepFormGroup['getRawValue']>) =>
      this.userApiService.createLoginOtp({ username: email }),
    onSuccess: (_, { email }) => {
      this.otpRequested.emit(email);
    },
  }));

  ngOnInit(): void {
    this.formGroup.patchValue({ email: this.email() });
  }
}

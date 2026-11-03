import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { injectMutation } from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';
import { InputOtpModule } from 'primeng/inputotp';
import { interval, map } from 'rxjs';

import {
  OTP_EXPIRATION_MS,
  OTP_LENGTH,
  OTP_REISSUE_COOLDOWN_MS,
} from '@121-service/src/user/user-otp/user-otp.const';

import { FormDefaultComponent } from '~/components/form-default/form-default.component';
import { FormErrorComponent } from '~/components/form-error/form-error.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { UserApiService } from '~/domains/user/user.api.service';
import { AuthService } from '~/services/auth.service';
import { ToastService } from '~/services/toast.service';
import { generateFieldErrors } from '~/utils/form-validation';

const CLOCK_TICK_MS = 1_000;

type LoginOtpStepFormGroup =
  (typeof BasicAuthLoginOtpStepComponent)['prototype']['formGroup'];

@Component({
  selector: 'app-basic-auth-login-otp-step',
  imports: [
    InputOtpModule,
    ButtonModule,
    DatePipe,
    FormDefaultComponent,
    FormErrorComponent,
    ReactiveFormsModule,
    FormFieldWrapperComponent,
  ],
  templateUrl: './basic-auth.login-otp-step.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicAuthLoginOtpStepComponent {
  private authService = inject(AuthService);
  private userApiService = inject(UserApiService);
  private toastService = inject(ToastService);
  readonly email = input.required<string>();
  readonly otpRequestedAt = input.required<number>();
  readonly returnUrl = input<string | undefined>(undefined);
  readonly otpRequested = output<string>();
  readonly changeEmail = output<string>();
  readonly passwordInstead = output<string>();

  readonly OTP_LENGTH = OTP_LENGTH;

  private readonly now = toSignal(
    interval(CLOCK_TICK_MS).pipe(map(() => Date.now())),
    { initialValue: Date.now() },
  );

  readonly otpRemainingMs = computed(() =>
    Math.max(0, this.otpRequestedAt() + OTP_EXPIRATION_MS - this.now()),
  );

  readonly canRequestNewOtp = computed(
    () => this.now() - this.otpRequestedAt() >= OTP_REISSUE_COOLDOWN_MS,
  );

  formGroup = new FormGroup({
    otp: new FormControl('', {
      nonNullable: true,
      validators: [
        // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
        Validators.required,
        Validators.minLength(OTP_LENGTH),
      ],
    }),
  });

  formFieldErrors = generateFieldErrors(this.formGroup);

  loginMutation = injectMutation(() => ({
    mutationFn: ({ otp }: ReturnType<LoginOtpStepFormGroup['getRawValue']>) =>
      this.authService.login({ username: this.email(), otp }, this.returnUrl()),
    onSuccess: () => {
      this.toastService.showToast({
        detail: $localize`Verification successful`,
      });
    },
  }));

  requestNewOtpMutation = injectMutation(() => ({
    mutationFn: () =>
      this.userApiService.createLoginOtp({ username: this.email() }),
    onSuccess: () => {
      this.formGroup.reset();
      this.loginMutation.reset();
      this.otpRequested.emit(this.email());
    },
  }));
}

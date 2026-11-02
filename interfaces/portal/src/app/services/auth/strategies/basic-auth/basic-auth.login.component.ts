import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { injectMutation } from '@tanstack/angular-query-experimental';
import { AutoFocus } from 'primeng/autofocus';
import { ButtonModule } from 'primeng/button';
import { InputOtpModule } from 'primeng/inputotp';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
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

enum LoginStep {
  email = 'email',
  otp = 'otp',
  password = 'password',
}

const CLOCK_TICK_MS = 1_000;

type EmailFormGroup =
  (typeof BasicAuthLoginComponent)['prototype']['emailFormGroup'];
type OtpFormGroup =
  (typeof BasicAuthLoginComponent)['prototype']['otpFormGroup'];
type PasswordFormGroup =
  (typeof BasicAuthLoginComponent)['prototype']['passwordFormGroup'];

@Component({
  selector: 'app-basic-auth-login',
  imports: [
    InputTextModule,
    InputOtpModule,
    PasswordModule,
    ButtonModule,
    AutoFocus,
    DatePipe,
    FormDefaultComponent,
    FormErrorComponent,
    ReactiveFormsModule,
    FormFieldWrapperComponent,
  ],
  templateUrl: './basic-auth.login.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicAuthLoginComponent {
  private authService = inject(AuthService);
  private userApiService = inject(UserApiService);
  private toastService = inject(ToastService);
  readonly returnUrl = input<string | undefined>(undefined);

  readonly LoginStep = LoginStep;
  readonly OTP_LENGTH = OTP_LENGTH;

  passWordResetSubject = `Request Password reset for 121 Platform: ${location.host}`; // NOTE: Not localized/translated, it's used by support-team only

  readonly step = signal(LoginStep.email);
  readonly email = signal('');
  private readonly otpRequestedAt = signal<number | undefined>(undefined);

  private readonly now = toSignal(
    interval(CLOCK_TICK_MS).pipe(map(() => Date.now())),
    { initialValue: Date.now() },
  );

  readonly otpRemainingMs = computed(() => {
    const otpRequestedAt = this.otpRequestedAt();

    if (otpRequestedAt === undefined) {
      return 0;
    }

    return Math.max(0, otpRequestedAt + OTP_EXPIRATION_MS - this.now());
  });

  readonly canRequestNewOtp = computed(() => {
    const otpRequestedAt = this.otpRequestedAt();

    if (otpRequestedAt === undefined) {
      return true;
    }

    return this.now() - otpRequestedAt >= OTP_REISSUE_COOLDOWN_MS;
  });

  emailFormGroup = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
      validators: [Validators.required, Validators.email],
    }),
  });

  emailFormFieldErrors = generateFieldErrors(this.emailFormGroup);

  otpFormGroup = new FormGroup({
    otp: new FormControl('', {
      nonNullable: true,
      validators: [
        // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
        Validators.required,
        Validators.minLength(OTP_LENGTH),
      ],
    }),
  });

  otpFormFieldErrors = generateFieldErrors(this.otpFormGroup);

  passwordFormGroup = new FormGroup({
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

  passwordFormFieldErrors = generateFieldErrors(this.passwordFormGroup);

  requestOtpMutation = injectMutation(() => ({
    mutationFn: ({ email }: ReturnType<EmailFormGroup['getRawValue']>) =>
      this.userApiService.createLoginOtp({ username: email }),
    onSuccess: (_, { email }) => {
      this.email.set(email);
      this.otpRequestedAt.set(Date.now());
      this.otpFormGroup.reset();
      this.otpLoginMutation.reset();
      this.step.set(LoginStep.otp);
    },
  }));

  otpLoginMutation = injectMutation(() => ({
    mutationFn: ({ otp }: ReturnType<OtpFormGroup['getRawValue']>) =>
      this.authService.login({ username: this.email(), otp }, this.returnUrl()),
    onSuccess: () => {
      this.toastService.showToast({
        detail: $localize`Verification successful`,
      });
    },
  }));

  passwordLoginMutation = injectMutation(() => ({
    mutationFn: ({
      email,
      password,
    }: ReturnType<PasswordFormGroup['getRawValue']>) =>
      this.authService.login({ username: email, password }, this.returnUrl()),
  }));

  requestNewOtp(): void {
    this.requestOtpMutation.mutate({ email: this.email() });
  }

  goToEmailStep({ email }: { email: string }): void {
    this.emailFormGroup.reset({ email });
    this.requestOtpMutation.reset();
    this.step.set(LoginStep.email);
  }

  goToPasswordStep({ email }: { email: string }): void {
    this.passwordFormGroup.reset({ email, password: '' });
    this.step.set(LoginStep.password);
  }
}

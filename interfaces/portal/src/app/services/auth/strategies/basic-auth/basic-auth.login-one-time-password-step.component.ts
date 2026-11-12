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
  ONE_TIME_PASSWORD_EXPIRATION_MS,
  ONE_TIME_PASSWORD_LENGTH,
  ONE_TIME_PASSWORD_REISSUE_COOLDOWN_MS,
} from '@121-service/src/user/user-one-time-password/user-one-time-password.const';

import { FormDefaultComponent } from '~/components/form-default/form-default.component';
import { FormErrorComponent } from '~/components/form-error/form-error.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { UserApiService } from '~/domains/user/user.api.service';
import { AuthService } from '~/services/auth.service';
import { LoginMethod } from '~/services/auth/login-method.enum';
import { ToastService } from '~/services/toast.service';
import { generateFieldErrors } from '~/utils/form-validation';

const CLOCK_TICK_MS = 1_000;

type LoginOneTimePasswordStepFormGroup =
  (typeof BasicAuthLoginOneTimePasswordStepComponent)['prototype']['formGroup'];

@Component({
  selector: 'app-basic-auth-login-one-time-password-step',
  imports: [
    InputOtpModule,
    ButtonModule,
    DatePipe,
    FormDefaultComponent,
    FormErrorComponent,
    ReactiveFormsModule,
    FormFieldWrapperComponent,
  ],
  templateUrl: './basic-auth.login-one-time-password-step.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicAuthLoginOneTimePasswordStepComponent {
  private authService = inject(AuthService);
  private userApiService = inject(UserApiService);
  private toastService = inject(ToastService);
  readonly email = input.required<string>();
  readonly oneTimePasswordRequestedAt = input.required<number>();
  readonly returnUrl = input<string | undefined>(undefined);
  readonly oneTimePasswordRequested = output<{ email: string }>();
  readonly changeEmail = output<{ email: string }>();
  readonly passwordInstead = output<{ email: string }>();

  readonly ONE_TIME_PASSWORD_LENGTH = ONE_TIME_PASSWORD_LENGTH;

  private readonly now = toSignal(
    interval(CLOCK_TICK_MS).pipe(map(() => Date.now())),
    { initialValue: Date.now() },
  );

  readonly oneTimePasswordRemainingMs = computed(() =>
    Math.max(
      0,
      this.oneTimePasswordRequestedAt() +
        ONE_TIME_PASSWORD_EXPIRATION_MS -
        this.now(),
    ),
  );

  readonly canRequestNewOneTimePassword = computed(
    () =>
      this.now() - this.oneTimePasswordRequestedAt() >=
      ONE_TIME_PASSWORD_REISSUE_COOLDOWN_MS,
  );

  formGroup = new FormGroup({
    oneTimePassword: new FormControl('', {
      nonNullable: true,
      validators: [
        // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
        Validators.required,
        Validators.minLength(ONE_TIME_PASSWORD_LENGTH),
      ],
    }),
  });

  formFieldErrors = generateFieldErrors(this.formGroup);

  loginMutation = injectMutation(() => ({
    mutationFn: ({
      oneTimePassword,
    }: ReturnType<LoginOneTimePasswordStepFormGroup['getRawValue']>) =>
      this.authService.login(
        {
          method: LoginMethod.oneTimePassword,
          username: this.email(),
          oneTimePassword,
        },
        this.returnUrl(),
      ),
    onSuccess: () => {
      this.toastService.showToast({
        detail: $localize`Verification successful`,
      });
    },
  }));

  requestNewOneTimePasswordMutation = injectMutation(() => ({
    mutationFn: () =>
      this.userApiService.createLoginOneTimePassword({
        username: this.email(),
      }),
    onSuccess: () => {
      this.formGroup.reset();
      this.loginMutation.reset();
      this.oneTimePasswordRequested.emit({ email: this.email() });
    },
  }));
}

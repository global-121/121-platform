import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
  viewChild,
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
import {
  InputOtp,
  InputOtpChangeEvent,
  InputOtpModule,
} from 'primeng/inputotp';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicAuthLoginOneTimePasswordStepComponent {
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private userApiService = inject(UserApiService);
  readonly email = input.required<string>();
  readonly oneTimePasswordRequestedAt = input.required<number>();
  readonly returnUrl = input<string | undefined>(undefined);
  readonly oneTimePasswordRequested = output<{ email: string }>();
  readonly changeEmail = output<{ email: string }>();
  readonly passwordInstead = output<{ email: string }>();

  readonly ONE_TIME_PASSWORD_LENGTH = ONE_TIME_PASSWORD_LENGTH;

  private readonly inputOtp = viewChild.required<
    InputOtp,
    ElementRef<HTMLElement>
  >(InputOtp, { read: ElementRef });

  private readonly now = toSignal(
    interval(CLOCK_TICK_MS).pipe(map(() => Date.now())),
    { initialValue: Date.now() },
  );

  // Rounded up to whole seconds, so it ticks in step with the cooldown countdown
  readonly oneTimePasswordRemainingMs = computed(
    () =>
      Math.max(
        0,
        Math.ceil(
          (this.oneTimePasswordRequestedAt() +
            ONE_TIME_PASSWORD_EXPIRATION_MS -
            this.now()) /
            CLOCK_TICK_MS,
        ),
      ) * CLOCK_TICK_MS,
  );

  readonly cooldownRemainingSeconds = computed(() =>
    Math.max(
      0,
      Math.ceil(
        (this.oneTimePasswordRequestedAt() +
          ONE_TIME_PASSWORD_REISSUE_COOLDOWN_MS -
          this.now()) /
          CLOCK_TICK_MS,
      ),
    ),
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
  }));
  requestNewOneTimePasswordMutation = injectMutation(() => ({
    mutationFn: () =>
      this.userApiService.createLoginOneTimePassword({
        username: this.email(),
      }),
    onSuccess: () => {
      this.formGroup.reset();
      this.loginMutation.reset();
      this.toastService.showToast({
        detail: $localize`We've sent a new code to ${this.email()}.`,
      });
      this.oneTimePasswordRequested.emit({ email: this.email() });
    },
  }));

  onOneTimePasswordChange({ originalEvent }: InputOtpChangeEvent): void {
    // A failed login's error no longer applies once the code is edited
    if (this.loginMutation.isError()) {
      this.loginMutation.reset();
    }

    // PrimeNG fills the boxes on paste or autofill, but doesn't move the focus
    // along like it does when typing
    const isMultiCharacterEntry =
      originalEvent.type === 'paste' ||
      (originalEvent.target instanceof HTMLInputElement &&
        originalEvent.target.value.length > 1);

    if (!isMultiCharacterEntry) {
      return;
    }

    const inputs = this.inputOtp().nativeElement.querySelectorAll('input');
    const filledLength =
      this.formGroup.controls.oneTimePassword.getRawValue().length;
    inputs[Math.min(filledLength, inputs.length - 1)].focus();
  }

  onOneTimePasswordEnter(event: Event): void {
    // PrimeNG blocks every key once all boxes are filled, Enter included,
    // which cancels the browser's own form submission
    if (event.defaultPrevented && event.target instanceof HTMLElement) {
      event.target.closest('form')?.requestSubmit();
    }
  }
}

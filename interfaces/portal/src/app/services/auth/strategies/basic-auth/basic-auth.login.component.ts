import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
} from '@angular/core';

import { ONE_TIME_PASSWORD_REISSUE_COOLDOWN_MS } from '@121-service/src/user/user-one-time-password/user-one-time-password.const';

import { BasicAuthLoginEmailStepComponent } from '~/services/auth/strategies/basic-auth/basic-auth.login-email-step.component';
import { BasicAuthLoginOneTimePasswordStepComponent } from '~/services/auth/strategies/basic-auth/basic-auth.login-one-time-password-step.component';
import { BasicAuthLoginPasswordStepComponent } from '~/services/auth/strategies/basic-auth/basic-auth.login-password-step.component';
import {
  getOneTimePasswordRequestFromSessionStorage,
  OneTimePasswordRequest,
  setOneTimePasswordRequestInSessionStorage,
} from '~/services/auth/strategies/basic-auth/one-time-password-request-storage';
import {
  TrackingAction,
  TrackingCategory,
} from '~/services/tracking/tracking.enums';
import { TrackingService } from '~/services/tracking/tracking.service';

enum LoginStep {
  email = 'email',
  oneTimePassword = 'oneTimePassword',
  password = 'password',
}

@Component({
  selector: 'app-basic-auth-login',
  imports: [
    BasicAuthLoginEmailStepComponent,
    BasicAuthLoginOneTimePasswordStepComponent,
    BasicAuthLoginPasswordStepComponent,
  ],
  templateUrl: './basic-auth.login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicAuthLoginComponent {
  private readonly trackingService = inject(TrackingService);
  readonly returnUrl = input<string | undefined>(undefined);

  readonly LoginStep = LoginStep;

  // Password is the default during the grace period for one-time code login
  readonly step = signal(LoginStep.password);
  readonly email = signal('');
  readonly oneTimePasswordRequest = signal<OneTimePasswordRequest | undefined>(
    getOneTimePasswordRequestFromSessionStorage(),
  );

  onOneTimePasswordRequested({ email }: { email: string }): void {
    this.trackingService.trackEvent({
      category: TrackingCategory.logIn,
      action:
        this.step() === LoginStep.oneTimePassword
          ? TrackingAction.submitRequestNewCode
          : TrackingAction.submitRequestCode,
    });

    if (!this.isWithinOneTimePasswordCooldown({ email })) {
      const oneTimePasswordRequest = { email, requestedAt: Date.now() };
      this.oneTimePasswordRequest.set(oneTimePasswordRequest);
      setOneTimePasswordRequestInSessionStorage(oneTimePasswordRequest);
    }
    this.goToStep({ step: LoginStep.oneTimePassword, email });
  }

  private isWithinOneTimePasswordCooldown({
    email,
  }: {
    email: string;
  }): boolean {
    const oneTimePasswordRequest = this.oneTimePasswordRequest();
    return (
      oneTimePasswordRequest?.email.toLowerCase() === email.toLowerCase() &&
      Date.now() - oneTimePasswordRequest.requestedAt <
        ONE_TIME_PASSWORD_REISSUE_COOLDOWN_MS
    );
  }

  onPasswordInstead({ email }: { email: string }): void {
    this.trackingService.trackEvent({
      category: TrackingCategory.logIn,
      action: TrackingAction.clickLogInWithPasswordInsteadButton,
      name:
        this.step() === LoginStep.oneTimePassword
          ? 'From Code Step'
          : 'From Email Step',
    });
    this.goToStep({ step: LoginStep.password, email });
  }

  onOneTimePasswordInstead({ email }: { email: string }): void {
    this.trackingService.trackEvent({
      category: TrackingCategory.logIn,
      action: TrackingAction.clickLogInWithCodeInsteadButton,
    });
    this.goToStep({ step: LoginStep.email, email });
  }

  goToStep({ step, email }: { step: LoginStep; email: string }): void {
    this.email.set(email);
    this.step.set(step);
  }
}

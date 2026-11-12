import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';

import { ONE_TIME_PASSWORD_REISSUE_COOLDOWN_MS } from '@121-service/src/user/user-one-time-password/user-one-time-password.const';

import { BasicAuthLoginEmailStepComponent } from '~/services/auth/strategies/basic-auth/basic-auth.login-email-step.component';
import { BasicAuthLoginOneTimePasswordStepComponent } from '~/services/auth/strategies/basic-auth/basic-auth.login-one-time-password-step.component';
import { BasicAuthLoginPasswordStepComponent } from '~/services/auth/strategies/basic-auth/basic-auth.login-password-step.component';

enum LoginStep {
  email = 'email',
  oneTimePassword = 'oneTimePassword',
  password = 'password',
}

interface OneTimePasswordRequest {
  email: string;
  requestedAt: number;
}

@Component({
  selector: 'app-basic-auth-login',
  imports: [
    BasicAuthLoginEmailStepComponent,
    BasicAuthLoginOneTimePasswordStepComponent,
    BasicAuthLoginPasswordStepComponent,
  ],
  templateUrl: './basic-auth.login.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicAuthLoginComponent {
  readonly returnUrl = input<string | undefined>(undefined);

  readonly LoginStep = LoginStep;

  readonly step = signal(LoginStep.email);
  readonly email = signal('');
  readonly oneTimePasswordRequest = signal<OneTimePasswordRequest | undefined>(
    undefined,
  );

  onOneTimePasswordRequested({ email }: { email: string }): void {
    if (!this.isWithinOneTimePasswordCooldown({ email })) {
      this.oneTimePasswordRequest.set({ email, requestedAt: Date.now() });
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
      oneTimePasswordRequest?.email === email &&
      Date.now() - oneTimePasswordRequest.requestedAt <
        ONE_TIME_PASSWORD_REISSUE_COOLDOWN_MS
    );
  }

  goToStep({ step, email }: { step: LoginStep; email: string }): void {
    this.email.set(email);
    this.step.set(step);
  }
}

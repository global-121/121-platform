import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';

import { OTP_REISSUE_COOLDOWN_MS } from '@121-service/src/user/user-otp/user-otp.const';

import { BasicAuthLoginEmailStepComponent } from '~/services/auth/strategies/basic-auth/basic-auth.login-email-step.component';
import { BasicAuthLoginOtpStepComponent } from '~/services/auth/strategies/basic-auth/basic-auth.login-otp-step.component';
import { BasicAuthLoginPasswordStepComponent } from '~/services/auth/strategies/basic-auth/basic-auth.login-password-step.component';

enum LoginStep {
  email = 'email',
  otp = 'otp',
  password = 'password',
}

interface OtpRequest {
  email: string;
  requestedAt: number;
}

@Component({
  selector: 'app-basic-auth-login',
  imports: [
    BasicAuthLoginEmailStepComponent,
    BasicAuthLoginOtpStepComponent,
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
  readonly otpRequest = signal<OtpRequest | undefined>(undefined);

  onOtpRequested({ email }: { email: string }): void {
    if (!this.isWithinOtpCooldown({ email })) {
      this.otpRequest.set({ email, requestedAt: Date.now() });
    }
    this.goToStep({ step: LoginStep.otp, email });
  }

  private isWithinOtpCooldown({ email }: { email: string }): boolean {
    const otpRequest = this.otpRequest();
    return (
      otpRequest?.email === email &&
      Date.now() - otpRequest.requestedAt < OTP_REISSUE_COOLDOWN_MS
    );
  }

  goToStep({ step, email }: { step: LoginStep; email: string }): void {
    this.email.set(email);
    this.step.set(step);
  }
}

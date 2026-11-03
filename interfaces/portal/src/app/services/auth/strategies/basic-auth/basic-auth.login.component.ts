import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';

import { BasicAuthLoginEmailStepComponent } from '~/services/auth/strategies/basic-auth/basic-auth.login-email-step.component';
import { BasicAuthLoginOtpStepComponent } from '~/services/auth/strategies/basic-auth/basic-auth.login-otp-step.component';
import { BasicAuthLoginPasswordStepComponent } from '~/services/auth/strategies/basic-auth/basic-auth.login-password-step.component';

enum LoginStep {
  email = 'email',
  otp = 'otp',
  password = 'password',
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

  goToStep({ step, email }: { step: LoginStep; email: string }): void {
    this.email.set(email);
    this.step.set(step);
  }
}

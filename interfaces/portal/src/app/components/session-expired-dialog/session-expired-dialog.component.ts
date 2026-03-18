import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  model,
} from '@angular/core';
import { Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

import { AppRoutes } from '~/app.routes';
import { SESSION_EXPIRED_IN_STATE_KEY } from '~/services/auth.service';

@Component({
  selector: 'app-session-expired-dialog',
  imports: [ButtonModule, DialogModule],
  templateUrl: './session-expired-dialog.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionExpiredDialogComponent {
  private readonly router = inject(Router);

  readonly dialogVisible = model(false);
  readonly returnUrl = input<string | undefined>(undefined);

  goToLogin() {
    this.dialogVisible.set(false);
    const url = this.returnUrl();
    const queryParams = url ? { returnUrl: url } : undefined;
    void this.router.navigate(['/', AppRoutes.login], {
      queryParams,
      state: {
        [SESSION_EXPIRED_IN_STATE_KEY]: true,
      },
    });
  }
}

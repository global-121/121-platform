import {
  ChangeDetectionStrategy,
  Component,
  inject,
  model,
} from '@angular/core';
import { Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

import { AuthService } from '~/services/auth.service';

@Component({
  selector: 'app-token-expiration-dialog',
  imports: [ButtonModule, DialogModule],
  templateUrl: './token-expiration-dialog.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class TokenExpirationDialogComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly dialogVisible = model(false);

  closeDialog() {
    this.dialogVisible.set(false);
  }

  async logout() {
    const currentUrl = this.router.url;
    this.dialogVisible.set(false);
    await this.authService.logout(undefined, currentUrl);
  }
}

import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { AuthService } from '~/services/auth.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [NgComponentOutlet],
  templateUrl: './auth-callback.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthCallbackPageComponent {
  private authService = inject(AuthService);

  CallbackComponent = this.authService.CallbackComponent;
}

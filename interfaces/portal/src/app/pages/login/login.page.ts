import { NgComponentOutlet, NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MessageModule } from 'primeng/message';
import { ToolbarModule } from 'primeng/toolbar';

import { AppRoutes } from '~/app.routes';
import { FormErrorComponent } from '~/components/form-error/form-error.component';
import { LocaleSwitcherComponent } from '~/components/locale-switcher/locale-switcher.component';
import { LogoComponent } from '~/components/logo/logo.component';
import { CookieBannerComponent } from '~/pages/login/components/cookie-banner/cookie-banner.component';
import {
  AUTH_ERROR_IN_STATE_KEY,
  AuthService,
  SESSION_EXPIRED_IN_STATE_KEY,
} from '~/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [
    LogoComponent,
    ToolbarModule,
    NgOptimizedImage,
    CookieBannerComponent,
    LocaleSwitcherComponent,
    NgComponentOutlet,
    FormErrorComponent,
    RouterLink,
    MessageModule,
  ],
  templateUrl: './login.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  AppRoutes = AppRoutes;
  LoginComponent = this.authService.LoginComponent;

  readonly returnUrl = computed(() => {
    const returnUrl: unknown = this.route.snapshot.queryParams.returnUrl;
    if (typeof returnUrl !== 'string') {
      return undefined;
    }
    return returnUrl;
  });

  readonly authError = computed(() => {
    const currentNavigation = this.router.currentNavigation();
    const authError: unknown =
      currentNavigation?.extras.state?.[AUTH_ERROR_IN_STATE_KEY];

    if (typeof authError === 'string') {
      return authError;
    }

    return undefined;
  });

  readonly sessionExpiredMessage = computed(() => {
    const state = history.state as Record<string, unknown> | undefined;
    if (state?.[SESSION_EXPIRED_IN_STATE_KEY]) {
      // Clear the flag so it doesn't reappear on refresh/back-nav
      history.replaceState(
        { ...state, [SESSION_EXPIRED_IN_STATE_KEY]: undefined },
        '',
      );
      return $localize`:@@session-expired-body:For security reasons, you've been logged out. After logging in, you'll return to where you left off.`;
    }
    return undefined;
  });
}

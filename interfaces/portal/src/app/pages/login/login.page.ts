import { NgComponentOutlet, NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ToolbarModule } from 'primeng/toolbar';

import { AppRoutes } from '~/app.routes';
import { FormErrorComponent } from '~/components/form-error/form-error.component';
import { LocaleSwitcherComponent } from '~/components/locale-switcher/locale-switcher.component';
import { LogoComponent } from '~/components/logo/logo.component';
import { CookieBannerComponent } from '~/pages/login/components/cookie-banner/cookie-banner.component';
import { AUTH_ERROR_IN_STATE_KEY, AuthService } from '~/services/auth.service';

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
}

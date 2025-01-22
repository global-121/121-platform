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
import { LanguageSwitcherComponent } from '~/components/language-switcher/language-switcher.component';
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
    LanguageSwitcherComponent,
    NgComponentOutlet,
    FormErrorComponent,
    RouterLink,
  ],
  templateUrl: './login.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {
  AppRoutes = AppRoutes;
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  authError: string | undefined;
  returnUrl = computed(() => {
    const returnUrl: unknown = this.route.snapshot.queryParams.returnUrl;
    if (typeof returnUrl !== 'string') {
      return undefined;
    }
    return returnUrl;
  });

  constructor() {
    const currentNavigation = this.router.getCurrentNavigation();
    const authError: unknown =
      currentNavigation?.extras.state?.[AUTH_ERROR_IN_STATE_KEY];

    if (typeof authError === 'string') {
      this.authError = authError;
    }
  }

  LoginComponent = this.authService.LoginComponent;
}

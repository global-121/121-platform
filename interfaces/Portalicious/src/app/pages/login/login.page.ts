import { NgComponentOutlet, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ToolbarModule } from 'primeng/toolbar';

import { LanguageSwitcherComponent } from '~/components/language-switcher/language-switcher.component';
import { LogoComponent } from '~/components/logo/logo.component';
import { CookieBannerComponent } from '~/pages/login/components/cookie-banner/cookie-banner.component';
import { AuthService } from '~/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    LogoComponent,
    ToolbarModule,
    NgOptimizedImage,
    CookieBannerComponent,
    LanguageSwitcherComponent,
    NgComponentOutlet,
  ],
  templateUrl: './login.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {
  private authService = inject(AuthService);

  LoginComponent = this.authService.LoginComponent;
}

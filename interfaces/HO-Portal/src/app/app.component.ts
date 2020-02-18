import { Component } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';
import { AuthService } from './auth/auth.service';
import { User } from './models/user.model';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent {
  public currentLanguage: string;
  public isLoggedIn: boolean;
  public currentUserRole: string;

  constructor(
    private translate: TranslateService,
    private authService: AuthService,
  ) {
    this.initializeApp();
    this.initializeLanguages();
  }

  initializeApp() {
    this.authService.authenticationState$.subscribe((user: User | null) => {
      this.isLoggedIn = (user) ? !!user.token : false;
      this.currentUserRole = (user) ? user.role : '';
    });
  }

  initializeLanguages() {
    this.translate.setDefaultLang('en');
    this.translate.use('en');

    this.currentLanguage = this.translate.currentLang;
  }

  public logout() {
    this.authService.logout();
  }
}

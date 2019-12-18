import { Component } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';
import { AuthService } from './auth/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent {
  public currentLanguage: string;

  constructor(
    private translate: TranslateService,
    private authService: AuthService,
  ) {
    this.initializeApp();
    this.initializeLanguages();
  }

  initializeApp() {
  }

  initializeLanguages() {
    this.translate.setDefaultLang('en');
    this.translate.use('en');

    this.currentLanguage = this.translate.currentLang;
  }

  public switchLanguage(event: any) {
    this.translate.use(event.detail.value);
  }

  public logout() {
    this.authService.logout();
  }
}

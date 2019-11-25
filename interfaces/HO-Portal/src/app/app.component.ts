import { Component } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent {
  public currentLanguage: string;

  constructor(
    private translate: TranslateService
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

  switchLanguage(event: any) {
    this.translate.use(event.detail.value);
  }
}

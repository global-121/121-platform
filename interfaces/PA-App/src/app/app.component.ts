import { Component } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { TranslateService } from '@ngx-translate/core';
import { UpdateService } from './services/update.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private translate: TranslateService,
    private updateService: UpdateService,
  ) {
    this.initializeApp();
    this.initializeLanguages();
    this.initializeUpdateChecker();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();
    });
  }

  initializeLanguages() {
    this.translate.setDefaultLang('en');
    this.translate.use('en');
  }

  initializeUpdateChecker() {
    localStorage.setItem('did', 'did:sov:1wJPyULfLLnYTEFYzByfUR');
    this.updateService.checkInclusion(1);
    this.updateService.checkCredential(1);
  }
}

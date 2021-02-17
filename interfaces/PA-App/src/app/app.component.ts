import { Component } from '@angular/core';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { Platform } from '@ionic/angular';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { environment } from 'src/environments/environment';
import { LoggingService } from './services/logging.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private loggingService: LoggingService,
    private translate: TranslateService,
  ) {
    this.initializeApp();

    this.loggingService.logPageView();

    if (environment.envName) {
      document.title += ` [ ${environment.envName} ]`;
    }

    // Update language + text-direction for the full interface
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      document.documentElement.lang = event.lang;
      document.documentElement.dir = this.translate.instant('_dir');
    });
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();
    });
  }
}

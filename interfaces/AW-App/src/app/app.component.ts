import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { environment } from 'src/environments/environment';
import { LoggingService } from './services/logging.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private loggingService: LoggingService,
  ) {
    this.initializeApp();

    if (this.loggingService.appInsightsEnabled) {
      this.loggingService.logPageView();
    }

    if (environment.envName) {
      document.title += ` [ ${environment.envName} ]`;
    }
  }

  initializeApp() {
    this.platform.ready().then(() => {});
  }
}

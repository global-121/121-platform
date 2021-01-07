import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
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

    this.loggingService.logPageView();
  }

  initializeApp() {
    this.platform.ready().then(() => {});
  }
}

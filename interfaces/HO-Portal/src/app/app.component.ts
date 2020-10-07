import { Component } from '@angular/core';
import { LoggingService } from './services/logging.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
})
export class AppComponent {
  constructor(private loggingService: LoggingService) {
    if (this.loggingService.appInsightsEnabled) {
      this.loggingService.logPageView();
    }
  }
}

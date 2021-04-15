import { Component } from '@angular/core';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { environment } from 'src/environments/environment';
import { LoggingService } from './services/logging.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
})
export class AppComponent {
  constructor(
    private loggingService: LoggingService,
    private translate: TranslateService,
  ) {
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
}

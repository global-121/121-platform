import { Component, OnDestroy, OnInit } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { LanguageService } from './services/language.service';
import { LoggingService } from './services/logging.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly _destroying$ = new Subject<void>();

  constructor(
    public languageService: LanguageService, // Required to load as early as possible in the lifecycle of the page to prevent incorrect languages shown in some components
    private loggingService: LoggingService,
    private msalService: MsalService,
  ) {
    // Initialize storage of preferred language
    this.languageService.setup();

    if (this.loggingService.appInsightsEnabled) {
      this.loggingService.logPageView();
    }

    if (environment.envName) {
      document.title += ` [ ${environment.envName} ]`;
    }
  }

  ngOnInit(): void {
    this.msalService.handleRedirectObservable().subscribe();
  }

  ngOnDestroy(): void {
    this._destroying$.next(undefined);
    this._destroying$.complete();
  }
}

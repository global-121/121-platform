import { Component, OnInit } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth/auth.service';
import { LanguageService } from './services/language.service';
import { LoggingService } from './services/logging.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
})
export class AppComponent implements OnInit {
  private useSso = environment.use_sso_azure_entra;

  constructor(
    public languageService: LanguageService, // Required to load as early as possible in the lifecycle of the page to prevent incorrect languages shown in some components
    private loggingService: LoggingService,
    private msalService: MsalService,
    private authService: AuthService,
  ) {
    // Logout non-SSO users
    if (this.useSso) {
      this.authService.logoutNonSSOUser();
    }
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
    if (this.useSso) {
      this.msalService.handleRedirectObservable().subscribe();
    }
  }
}

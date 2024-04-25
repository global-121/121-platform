import { Component, OnDestroy, OnInit } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AppRoutes } from './app-routes.enum';
import { AuthService } from './auth/auth.service';
import { LanguageService } from './services/language.service';
import { LoggingService } from './services/logging.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
})
export class AppComponent implements OnInit, OnDestroy {
  private useSso = environment.use_sso_azure_entra;
  private msalSubscription: Subscription;

  constructor(
    public languageService: LanguageService, // Required to load as early as possible in the lifecycle of the page to prevent incorrect languages shown in some components
    private loggingService: LoggingService,
    private msalService?: MsalService,
    private authService?: AuthService,
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

  public ngOnInit(): void {
    if (this.useSso) {
      this.authService.logoutNonSSOUser();

      this.msalSubscription = this.msalService
        .handleRedirectObservable()
        .subscribe({
          next: async (result) => {
            if (result && result.account && result.account.username) {
              const shouldRedirectToHome = window.location.pathname.endsWith(
                AppRoutes.auth,
              );
              await this.authService.processAzureAuthSuccess(
                shouldRedirectToHome,
              );
            }
          },
          error: (error) => {
            console.error('Error during Azure Entra authentication', error);
          },
        });
    }
  }

  public ngOnDestroy(): void {
    if (this.useSso && this.msalSubscription) {
      this.msalSubscription.unsubscribe();
    }
  }
}

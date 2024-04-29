import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
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
    private route: ActivatedRoute,
    private authService?: AuthService,
    private msalService?: MsalService,
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
      this.authService.logoutNonSsoUser();

      this.authService.authenticationState$.subscribe(async (user) => {
        const programId = this.route.snapshot.params.programId;

        // For valid users, but without any (program-specific) permissions; do a refresh-check with Azure Entra.
        if (
          (user && !Object.keys(user?.permissions).length) ||
          (user && programId && !user?.permissions[programId])
        ) {
          await this.authService.processAzureAuthSuccess();
        }
      });

      this.msalSubscription = this.msalService
        .handleRedirectObservable()
        .subscribe();
    }
  }

  public ngOnDestroy(): void {
    if (this.useSso && this.msalSubscription) {
      this.msalSubscription.unsubscribe();
    }
  }
}

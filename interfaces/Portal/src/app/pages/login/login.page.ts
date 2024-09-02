import { HttpStatusCode } from '@angular/common/http';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { LoggingService } from 'src/app/services/logging.service';
import { isPopupBlocked } from 'src/app/shared/utils/check-pop-up-is-blocked.utils';
import { isIframed } from 'src/app/shared/utils/is-iframed.util';
import { environment } from '../../../environments/environment';
import { AppRoutes } from '../../app-routes.enum';
import {
  AuthService,
  SSO_ERRORS,
  SSO_ERROR_KEY,
} from '../../auth/auth.service';
import { SystemNotificationComponent } from '../../components/system-notification/system-notification.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnDestroy, OnInit {
  public useSso = environment.use_sso_azure_entra;

  @ViewChild('loginForm')
  public loginForm: NgForm;

  @ViewChild('systemNotification', { static: false })
  private systemNotification: SystemNotificationComponent;

  public email = '';
  public password = '';

  public errorStatusCode = 0;
  public showLoginFail = {
    email: false,
    password: false,
  };
  public invalidEmail = false;
  public emptyPassword = false;

  public inputType: 'password' | 'text' = 'password';
  public labelShow = this.translate.instant(
    'page.login.form.password.toggle.show',
  );
  public labelHide = this.translate.instant(
    'page.login.form.password.toggle.hide',
  );

  private msalSubscription: Subscription;

  public ssoUserIsNotFound: boolean;
  public isPopupBlocked = false;
  public isLogoutForced = false;

  constructor(
    private authService: AuthService,
    private translate: TranslateService,
    private router: Router,
    private msalService?: MsalService,
    private loggingService?: LoggingService,
  ) {}

  ngOnInit(): void {
    if (environment.use_sso_azure_entra) {
      // Retrieve the error message from session storage
      this.ssoUserIsNotFound =
        sessionStorage.getItem(SSO_ERROR_KEY) === SSO_ERRORS.notFound;
      sessionStorage.removeItem(SSO_ERROR_KEY);

      if (isIframed()) {
        this.isPopupBlocked = isPopupBlocked();
      }

      this.isLogoutForced = window.location.search.includes('?forced');
    }
  }

  ngOnDestroy(): void {
    if (this.msalSubscription) {
      this.msalSubscription.unsubscribe();
    }
  }

  ionViewWillLeave(): void {
    this.systemNotification.closeToast();
  }

  public async doLogin() {
    if (!this.loginForm.form.valid) {
      return;
    }

    this.errorStatusCode = 0;
    this.showLoginFail.email = false;
    this.showLoginFail.password = false;
    this.inputType = 'password';

    this.authService
      .login(this.email, this.password)
      .then(() => {
        // Remove credentials from interface-state to prevent re-use after log-out:
        this.loginForm.resetForm();
        this.invalidEmail = false;
        this.emptyPassword = false;
      })
      .catch(({ error }) => {
        console.error(error);
        this.errorStatusCode = error?.statusCode;
        if (error?.statusCode === HttpStatusCode.Unauthorized) {
          this.showLoginFail.email = true;
          this.showLoginFail.password = true;
        }
      });
  }

  public onEmailBlur() {
    this.checkValidEmail();
    this.showLoginFail.email = false;
  }

  private checkValidEmail() {
    this.invalidEmail = this.loginForm.form.get('email').invalid;
  }

  public onPasswordBlur() {
    this.checkEmptyPassword();
    this.showLoginFail.password = false;
  }

  private checkEmptyPassword() {
    this.emptyPassword = this.password === '';
  }

  isPassword() {
    return this.inputType === 'password';
  }

  toggleInputType() {
    this.inputType = this.isPassword() ? 'text' : 'password';
  }

  public loginSso() {
    if (!isIframed()) {
      this.msalService.loginRedirect();
      return;
    }

    this.msalSubscription = this.msalService.loginPopup().subscribe({
      next: async () => {
        await this.authService.processAzureAuthSuccess();
        await this.router.navigate([
          '/',
          AppRoutes.iframe,
          AppRoutes.iframeRecipient,
        ]);
      },
      error: (error) => {
        console.error('Error during Azure Entra authentication', error);
        this.loggingService.logException(error);
        this.loggingService.logEvent('error-sso-unknown', {
          message: error.message ?? 'unknown',
        });
      },
    });
  }
}

import { Component, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AppRoutes } from '../app-routes.enum';
import { AuthService } from '../auth/auth.service';
import { SystemNotificationComponent } from '../components/system-notification/system-notification.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  @ViewChild('loginForm', { static: true })
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

  constructor(
    private authService: AuthService,
    private translate: TranslateService,
    private router: Router,
  ) {}

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
        if (error?.statusCode === 401) {
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
    // redirect to /home which will in turn redirect to SSO flow
    this.router.navigate(['/', AppRoutes.home]);
  }
}

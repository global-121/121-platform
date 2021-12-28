import { Component, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
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

  constructor(private authService: AuthService) {}

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
}

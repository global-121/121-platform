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
  public password: any;

  public validEmail = true;
  public errorStatusCode = 0;

  constructor(private authService: AuthService) {}

  ionViewWillLeave(): void {
    this.systemNotification.closeToast();
  }

  public async doLogin() {
    if (!this.loginForm.form.valid) {
      return;
    }

    this.authService
      .login(this.email, this.password)
      .then(() => {
        // Remove credentials from interface-state to prevent re-use after log-out:
        this.loginForm.resetForm();
        this.errorStatusCode = 0;
        this.validEmail = true;
      })
      .catch(({ error }) => (this.errorStatusCode = error?.statusCode));
  }

  public onBlur() {
    this.checkValidEmail();
  }

  private checkValidEmail() {
    this.validEmail =
      this.email === '' || this.loginForm.form.get('email').valid;
  }
}

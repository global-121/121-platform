import { Component, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  @ViewChild('loginForm', { static: true })
  public loginForm: NgForm;

  public email = '';
  public password: any;

  public validEmail = true;
  public errorStatusCode = 0;

  constructor(private authService: AuthService) {}

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
      .catch(({ error }) => (this.errorStatusCode = error.statusCode));
  }

  public onChange() {
    this.checkValidEmail();
  }

  private checkValidEmail() {
    this.validEmail =
      this.email === '' || this.loginForm.form.get('email').status === 'VALID';
  }
}

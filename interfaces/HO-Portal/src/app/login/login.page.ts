import { Component, ViewChild } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  @ViewChild('loginForm')
  public loginForm: NgForm;

  public email: any;
  public password: any;

  constructor(
    private authService: AuthService,
  ) { }

  public async doLogin() {
    console.log('doLogin()');

    if (!this.loginForm.form.valid) {
      return;
    }

    this.authService.login(
      this.email,
      this.password
    ).then(() => {
      // Remove credentials from interface-state to prevent re-use after log-out:
      this.loginForm.resetForm();
    });

  }
}

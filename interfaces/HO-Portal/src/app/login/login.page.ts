import { Component } from '@angular/core';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {

  public email: any;
  public password: any;

  constructor(
    private authService: AuthService,
  ) { }

  public doLogin() {
    console.log('doLogin()');

    this.authService.login(
      this.email,
      this.password
    );

  }
}

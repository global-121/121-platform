import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {


  constructor(
    private authService: AuthService,
  ) { }

  ngOnInit() {
  }
  public async doLogin(event) {
    console.log('doLogin()');
    this.authService.login(event);

  }
}

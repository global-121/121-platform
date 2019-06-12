import { Component, OnInit } from '@angular/core';
import { ProgramsServiceApiService } from '../services/programs-service-api.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  public isLoggedIn = false;

  constructor(
    public programsService: ProgramsServiceApiService
  ) { }

  ngOnInit() {
  }

  public async doLogin(event) {
    console.log('doLogin()');

    event.preventDefault();

    this.programsService.login(
      event.target.elements.email.value,
      event.target.elements.password.value
    ).subscribe(
      (response) => {
        console.log('LoginPage subscribe:', response);

        this.isLoggedIn = true;

        window.location.href = '/home';
      },
      (error) => {
        console.log('LoginPage error: ', error);
      }
    );
  }
}

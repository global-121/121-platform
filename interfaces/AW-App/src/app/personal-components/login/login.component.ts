import { Component, OnInit } from '@angular/core';
import { CustomTranslateService } from 'src/app/services/custom-translate.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  public emailPlaceholder: string;
  public passwordPlaceholder: string;
  public isLoggedIn: boolean;
  public wrongCredentials: boolean;

  constructor(
    public customTranslateService: CustomTranslateService,
    public programsService: ProgramsServiceApiService
  ) { }

  ngOnInit() {
    this.emailPlaceholder = this.customTranslateService.translate('personal.login.email-placeholder');
    this.passwordPlaceholder = this.customTranslateService.translate('personal.login.password-placeholder');
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
        this.wrongCredentials = false;

      },
      (error) => {
        console.log('LoginPage error: ', error);
        this.wrongCredentials = true;
      }
    );
  }

}

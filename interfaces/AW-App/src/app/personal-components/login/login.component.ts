import { Component, OnInit } from '@angular/core';
import { CustomTranslateService } from 'src/app/services/custom-translate.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  public usernamePlaceholder: string;
  public passwordPlaceholder: string;

  constructor(
    public customTranslateService: CustomTranslateService
  ) { }

  ngOnInit() {
    this.usernamePlaceholder = this.customTranslateService.translate('personal.login.username-placeholder');
    this.passwordPlaceholder = this.customTranslateService.translate('personal.login.password-placeholder');
  }

  public submitLogin(username, password) {
    console.log(username, password);
  }

}

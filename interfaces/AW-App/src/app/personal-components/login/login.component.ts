import { Component } from '@angular/core';
import { CustomTranslateService } from 'src/app/services/custom-translate.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { PersonalComponent } from '../personal-components.interface';
import { ConversationService } from 'src/app/services/conversation.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements PersonalComponent {
  public emailPlaceholder: string;
  public passwordPlaceholder: string;
  public isLoggedIn: boolean;
  public wrongCredentials: boolean;

  constructor(
    public customTranslateService: CustomTranslateService,
    public programsService: ProgramsServiceApiService,
    public conversationService: ConversationService
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

        this.complete();

      },
      (error) => {
        console.log('LoginPage error: ', error);
        this.wrongCredentials = true;
      }
    );
  }

  getNextSection() {
    return 'main-menu';
  }

  complete() {
    this.conversationService.onSectionCompleted({
      name: 'login',
      data: {
        isLoggedIn: this.isLoggedIn
      },
      next: this.getNextSection(),
    });
  }

}

import { Component, Input } from '@angular/core';
import { ConversationService } from 'src/app/services/conversation.service';
import { PersonalComponents } from '../personal-components.enum';
import { PersonalComponent } from '../personal-component.class';
import { environment } from 'src/environments/environment';

export enum idChoices {
  create = 'create-id',
  login = 'login-id',
}

@Component({
  selector: 'app-signup-signin',
  templateUrl: './signup-signin.component.html',
  styleUrls: ['./signup-signin.component.scss'],
})
export class SignupSigninComponent extends PersonalComponent {
  @Input()
  public data: any;

  public useLocalStorage: boolean;
  public idChoices = idChoices;
  public signupSigninChoice: string;
  public typeChosen: boolean;

  constructor(public conversationService: ConversationService) {
    super();
    this.useLocalStorage = environment.localStorage;
  }

  ngOnInit() {
    if (this.data) {
      this.initHistory();
    }
  }

  initHistory() {
    this.typeChosen = true;
    this.signupSigninChoice = this.data.signupSigninChoice;
    this.isDisabled = true;
  }

  public changeSignupSignin(value: string) {
    this.signupSigninChoice = value;
  }

  public submitSignupSignin() {
    this.typeChosen = true;

    this.complete();
  }

  getNextSection() {
    if (this.signupSigninChoice === idChoices.create) {
      return PersonalComponents.createIdentity;
    } else if (this.signupSigninChoice === idChoices.login) {
      return PersonalComponents.loginIdentity;
    }
  }

  complete() {
    this.isDisabled = true;
    this.conversationService.onSectionCompleted({
      name: PersonalComponents.signupSignin,
      data: {
        signupSigninChoice: this.signupSigninChoice,
      },
      next: this.getNextSection(),
    });
  }
}

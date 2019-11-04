import { Component } from '@angular/core';
import { ConversationService } from 'src/app/services/conversation.service';
import { PersonalComponents } from '../personal-components.enum';
import { PersonalComponent } from '../personal-component.class';

@Component({
  selector: 'app-signup-signin',
  templateUrl: './signup-signin.component.html',
  styleUrls: ['./signup-signin.component.scss'],
})
export class SignupSigninComponent extends PersonalComponent {
  public signupSigninChoice: string;
  public typeChosen: boolean;
  public programChosen: boolean;

  constructor(
    public conversationService: ConversationService,
  ) {
    super();
  }

  ngOnInit() { }

  public changeSignupSignin(value: string) {
    this.signupSigninChoice = value;
  }

  public submitSignupSignin() {
    this.typeChosen = true;

    this.complete();
  }

  getNextSection() {
    if (this.signupSigninChoice === 'create-id') {
      return PersonalComponents.createIdentity;
    } else if (this.signupSigninChoice === 'login-id') {
      // return PersonalComponents.loginIdentity;
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

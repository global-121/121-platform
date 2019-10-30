import { Component } from '@angular/core';
import { PersonalComponent } from '../personal-component.class';
import { PersonalComponents } from '../personal-components.enum';

import { ConversationService } from 'src/app/services/conversation.service';

@Component({
  selector: 'app-choose-credential-type',
  templateUrl: './choose-credential-type.component.html',
  styleUrls: ['./choose-credential-type.component.scss'],
})
export class ChooseCredentialTypeComponent extends PersonalComponent {
  public credentialTypeChoice: string;
  public typeChosen: boolean;
  public programChosen: boolean;

  constructor(
    public conversationService: ConversationService,
  ) {
    super();
  }

  ngOnInit() {
  }

  public changeCredentialType(value: string) {
    this.credentialTypeChoice = value;
  }

  public submitCredentialType() {
    this.typeChosen = true;
    this.conversationService.scrollToEnd();

    // Here should be checked whether Digital ID already present
    if (this.credentialTypeChoice === 'apply-to-program') {
      this.programChosen = true;
    } else if (this.credentialTypeChoice === 'create-id') {
      this.programChosen = false;

      this.complete();
    }
  }

  public submitCredentialTypeNew() {
    this.complete();
  }

  getNextSection() {
    return PersonalComponents.createIdentity;
  }

  complete() {
    this.isDisabled = true;
    this.conversationService.onSectionCompleted({
      name: PersonalComponents.chooseCredentialType,
      data: {
        credentialTypeChoice: this.credentialTypeChoice,
      },
      next: this.getNextSection(),
    });
  }
}

import { Component } from '@angular/core';
import { PersonalComponent } from '../personal-component.interface';

import { Storage } from '@ionic/storage';
import { TranslateService } from '@ngx-translate/core';
import { ConversationService } from 'src/app/services/conversation.service';

@Component({
  selector: 'app-choose-credential-type',
  templateUrl: './choose-credential-type.component.html',
  styleUrls: ['./choose-credential-type.component.scss'],
})
export class ChooseCredentialTypeComponent implements PersonalComponent {

  public credentialTypes: any;
  public credentialTypeChoice: string;
  public programChosen: boolean;
  public credentialTypeChoiceNew: string;

  constructor(
    public storage: Storage,
    public translate: TranslateService,
    public conversationService: ConversationService,
  ) { }

  ngOnInit() {
    this.credentialTypes = [
      {
        id: 'apply-to-program',
        credentialType: this.translate.instant('personal.choose-credential-type.option1'),
        disabled: false,
      },
      {
        id: 'create-id',
        credentialType: this.translate.instant('personal.choose-credential-type.option2'),
        disabled: false,
      },
      {
        id: 'delete-id',
        credentialType: this.translate.instant('personal.choose-credential-type.option3'),
        disabled: true,
      },
    ];
  }

  private storeCredentialType(credentialTypeChoice: any) {
    this.storage.set('credentialTypeChoice', credentialTypeChoice);
  }

  public changeCredentialType($event, iteration: string) {
    if (iteration === 'apply-to-program') {
      const credentialTypeChoice = $event.detail.value;
      this.credentialTypeChoice = credentialTypeChoice;
      this.storeCredentialType(credentialTypeChoice);
    } else if (iteration === 'create-id') {
      const credentialTypeChoiceNew = $event.detail.value;
      this.credentialTypeChoiceNew = credentialTypeChoiceNew;
      this.storeCredentialType(credentialTypeChoiceNew);
    }
  }

  public submitCredentialType() {
    console.log('Chosen credential type: ', this.credentialTypeChoice);
    // Here should be checked whether Digital ID already present
    if (this.credentialTypeChoice === 'apply-to-program') {
      this.programChosen = true;
    } else if (this.credentialTypeChoice === 'create-id') {
      this.programChosen = false;
    }
  }

  public submitCredentialTypeNew() {
    console.log('Chosen credential type: ', this.credentialTypeChoiceNew);

    this.complete();
  }

  getNextSection() {
    return 'create-identity-password';
  }

  complete() {
    this.conversationService.onSectionCompleted({
      name: 'choose-credential-type',
      data: {
        credentialTypeChoice: this.credentialTypeChoice,
      },
      next: this.getNextSection(),
    });
  }
}

import { Component } from '@angular/core';
import { Storage } from '@ionic/storage';
import { PersonalComponent } from '../personal-component.interface';
import { PersonalComponents } from '../personal-components.enum';

import { ConversationService } from 'src/app/services/conversation.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { PaAccountApiService } from 'src/app/services/pa-account-api.service';

@Component({
  selector: 'app-identity-form',
  templateUrl: './identity-form.component.html',
  styleUrls: ['./identity-form.component.scss'],
})
export class IdentityFormComponent implements PersonalComponent {
  public isDisabled = false;

  public namePlaceholder: any;
  public dobPlaceholder: any;
  public name: any;
  public dob: any;
  public identitySubmitted: boolean;
  public programId: number;

  constructor(
    public conversationService: ConversationService,
    public programsService: ProgramsServiceApiService,
    public paAccountApiService: PaAccountApiService,
    public storage: Storage,
  ) { }

  ngOnInit() {
  }

  public async submitIdentityForm(name, dob) {
    if (!name || !dob) {
      return;
    }

    await this.postPrefilledAnswers(name, dob);

    this.identitySubmitted = true;
    console.log(name, dob);

    this.complete();
  }

  // NOTE: This should maybe become a shared function
  async paRetrieveData(variableName: string): Promise<any> {
    return await this.paAccountApiService.retrieve(variableName)
      .toPromise();
  }

  // NOTE This should maybe become a shared function
  async postPrefilledAnswers(name, dob): Promise<void> {

    const did = await this.paRetrieveData('did');
    await this.storage.get('programChoice').then(value => {
      this.programId = value;
    });
    const prefilledAnswers = {
      did,
      programId: this.programId,
      credentialType: 'identity',
      attributes: [
        {
          attributeId: 1,
          attribute: 'name',
          answer: name
        },
        {
          attributeId: 2,
          attribute: 'dob',
          answer: dob
        }
      ]
    };

    await this.programsService.postPrefilledAnswers(
      prefilledAnswers.did,
      prefilledAnswers.programId,
      prefilledAnswers.credentialType,
      prefilledAnswers.attributes
    ).toPromise();

  }

  getNextSection() {
    return PersonalComponents.selectCountry;
  }

  complete() {
    this.isDisabled = true;
    this.conversationService.onSectionCompleted({
      name: PersonalComponents.createIdentity,
      data: {
        name: this.name,
        dob: this.dob,
      },
      next: this.getNextSection(),
    });
  }
}

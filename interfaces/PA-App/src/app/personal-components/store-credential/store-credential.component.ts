import { Component } from '@angular/core';
import { PersonalComponent } from '../personal-component.class';

import { UpdateService } from 'src/app/services/update.service';
import { PaAccountApiService } from 'src/app/services/pa-account-api.service';
import { UserImsApiService } from 'src/app/services/user-ims-api.service';

import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { PersonalComponents } from '../personal-components.enum';
import { ConversationService } from 'src/app/services/conversation.service';

import { Storage } from '@ionic/storage';


@Component({
  selector: 'app-store-credential',
  templateUrl: './store-credential.component.html',
  styleUrls: ['./store-credential.component.scss'],
})
export class StoreCredentialComponent extends PersonalComponent {

  public credentialReceived = false;
  public credentialStored = false;

  constructor(
    public conversationService: ConversationService,
    public updateService: UpdateService,
    public paAccountApiService: PaAccountApiService,
    public userImsApiService: UserImsApiService,
    public storage: Storage,
    public programsService: ProgramsServiceApiService,
  ) {
    super();
  }

  ngOnInit() {
    this.startListenCredential();
  }

  async startListenCredential() {
    console.log('startListenCredential');

    // 1. Listen until credential is received
    const did = await this.paRetrieveData('did');
    console.log('did', did);
    const programId = await this.paRetrieveData('programId');
    console.log('programId', programId);
    this.updateService.checkCredential(parseInt(programId, 10), did).then(res => {
      let credential;
      this.programsService.getCredential(did).subscribe(response => {
        credential = response;
        this.credentialReceived = true;
        this.storeCredential(credential);
      });
    });
  }

  // NOTE: This should become a shared function
  async paRetrieveData(variableName: string): Promise<any> {
    return await this.paAccountApiService.retrieve(variableName)
      .toPromise();
  }

  async storeCredential(credential): Promise<void> {
    console.log('Trying to store this credential', credential);
    const wallet = JSON.parse(await this.paRetrieveData('wallet'));
    const correlation = JSON.parse(await this.paRetrieveData('correlation'));
    const credentialRequest = JSON.parse(await this.paRetrieveData('credentialRequest'));
    const credDefID = JSON.parse(await this.paRetrieveData('credDefId'));
    const credentialFormat = JSON.parse(credential.message);
    const storeCredentialData = {
      credDefID,
      credentialRequestMetadata: credentialRequest.credentialRequestMetadata,
      credential: credentialFormat.credential,
      wallet,
      correlation,
    };
    await this.userImsApiService.storeCredential(
      storeCredentialData.credDefID,
      storeCredentialData.credentialRequestMetadata,
      storeCredentialData.credential,
      storeCredentialData.wallet,
      storeCredentialData.correlation
    ).toPromise();
    this.credentialStored = true;
    this.complete();
  }

  complete() {
    this.conversationService.onSectionCompleted({
      name: PersonalComponents.initialNeeds,
      data: {},
      next: this.getNextSection(),
    });
  }

  getNextSection() {
    console.log('next!!!!');
    return PersonalComponents.handleProof;
  }
}

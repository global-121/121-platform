import { PaDataService } from './../../services/storage.service';
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
    public storageService: PaDataService,
    public programsService: ProgramsServiceApiService,
  ) {
    super();

    this.conversationService.startLoading();
  }

  ngOnInit() {
    this.startListenCredential();
  }

  async startListenCredential() {
    console.log('startListenCredential');

    // 1. Listen until credential is received
    const did = await this.storageService.retrieve(this.storageService.type.did);
    const programId = parseInt(await this.storageService.retrieve(this.storageService.type.programId), 10);

    this.updateService.checkCredential(programId, did).then(() => {
      this.programsService.getCredential(did).subscribe(response => {
        const credential = response;
        this.credentialReceived = true;
        this.storeCredential(credential);
      });
    });
  }



  async storeCredential(credential): Promise<void> {
    console.log('Trying to store this credential', credential);
    const wallet = JSON.parse(await this.storageService.retrieve(this.storageService.type.wallet));
    const credentialRequest = JSON.parse(await this.storageService.retrieve(this.storageService.type.credentialRequest));
    const credDefID = JSON.parse(await this.storageService.retrieve(this.storageService.type.credDefId));
    const credentialFormat = JSON.parse(credential.message);

    const storeCredentialData = {
      credDefID,
      credentialRequestMetadata: credentialRequest.credentialRequestMetadata,
      credential: credentialFormat.credential,
      wallet,
    };
    await this.userImsApiService.storeCredential(
      storeCredentialData.credDefID,
      storeCredentialData.credentialRequestMetadata,
      storeCredentialData.credential,
      storeCredentialData.wallet,
    );
    this.credentialStored = true;
    this.conversationService.stopLoading();
    this.complete();
  }

  getNextSection() {
    return PersonalComponents.handleProof;
  }

  complete() {
    this.conversationService.onSectionCompleted({
      name: PersonalComponents.storeCredential,
      data: {},
      next: this.getNextSection(),
    });
  }
}

import { Component } from '@angular/core';
import { PersonalComponent } from '../personal-component.class';

import { PaDataService } from 'src/app/services/padata.service';
import { UpdateService } from 'src/app/services/update.service';
import { SovrinService } from 'src/app/services/sovrin.service';

import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { PersonalComponents } from '../personal-components.enum';
import { ConversationService } from 'src/app/services/conversation.service';

@Component({
  selector: 'app-store-credential',
  templateUrl: './store-credential.component.html',
  styleUrls: ['./store-credential.component.scss'],
})
export class StoreCredentialComponent extends PersonalComponent {

  public credentialReceived = false;
  public credentialStored = false;
  public ngo: string;

  constructor(
    public conversationService: ConversationService,
    public updateService: UpdateService,
    public sovrinService: SovrinService,
    public paData: PaDataService,
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
    const did = await this.paData.retrieve(this.paData.type.did);
    const programId = parseInt(await this.paData.retrieve(this.paData.type.programId), 10);
    this.ngo = this.paData.myPrograms[programId].ngo;

    this.updateService.checkCredential(programId, did).then(() => {
      this.programsService.getCredential(did).subscribe(response => {
        const credential = response;
        this.credentialReceived = true;
        this.conversationService.startLoading();
        this.storeCredential(credential);
      });
    });
  }



  async storeCredential(credential): Promise<void> {
    console.log('Trying to store this credential', credential);
    const wallet = await this.paData.retrieve(this.paData.type.wallet);
    const credentialRequest = await this.paData.retrieve(this.paData.type.credentialRequest);
    const credDefID = await this.paData.retrieve(this.paData.type.credDefId);
    const credentialFormat = credential.message;

    await this.sovrinService.storeCredential(
      credDefID,
      credentialRequest.credentialRequestMetadata,
      credentialFormat.credential,
      wallet,
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

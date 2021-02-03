import { Component, Input } from '@angular/core';
import { PaInclusionStates } from 'src/app/models/pa-statuses.enum';
import { Program } from 'src/app/models/program.model';
import { PersonalComponent } from 'src/app/personal-components/personal-component.class';
import { PersonalComponents } from 'src/app/personal-components/personal-components.enum';
import { ConversationService } from 'src/app/services/conversation.service';
import { PaDataService } from 'src/app/services/padata.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { SovrinService } from 'src/app/services/sovrin.service';
import { UpdateService } from 'src/app/services/update.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-store-credential',
  templateUrl: './store-credential.component.html',
  styleUrls: ['./store-credential.component.scss'],
})
export class StoreCredentialComponent extends PersonalComponent {
  @Input()
  public data: any;

  public isDebug = environment.isDebug;
  private useLocalStorage = environment.localStorage;

  public currentProgram: Program;

  public isListening = false;
  public credentialReceived = false;
  public credentialStored = false;

  constructor(
    public conversationService: ConversationService,
    public updateService: UpdateService,
    public sovrinService: SovrinService,
    public paData: PaDataService,
    public programsService: ProgramsServiceApiService,
  ) {
    super();
  }

  async ngOnInit() {
    this.currentProgram = await this.paData.getCurrentProgram();

    if (this.data) {
      this.initHistory();
      return;
    }
    await this.initNew();
  }

  async initNew() {
    await this.checkValidation();

    if (this.isCanceled) {
      return;
    }

    if (this.isDebug) {
      return;
    }
    this.startListening();
  }

  initHistory() {
    this.isCanceled = this.data.isCanceled;

    if (this.isCanceled) {
      return;
    }

    this.isDisabled = true;
    this.credentialReceived = this.data.credentialReceived;
    this.credentialStored = this.data.credentialStored;
  }

  async checkValidation() {
    const validationSkipped = await this.checkValidationSkipped();
    if (
      validationSkipped || // PA validation is skipped, but PA is included/rejected
      !this.currentProgram.validation // Program contains no validation
    ) {
      this.cancel();
    }
  }

  async checkValidationSkipped() {
    const programId = await this.paData.getCurrentProgramId();
    const did = await this.paData.retrieve(this.paData.type.did);
    const inclusionStatus = await this.programsService
      .checkInclusionStatus(did, programId)
      .toPromise();

    return (
      inclusionStatus === PaInclusionStates.included ||
      inclusionStatus === PaInclusionStates.rejected
    );
  }

  async startListening() {
    const did = await this.paData.retrieve(this.paData.type.did);
    if (!this.useLocalStorage) {
      this.startListeningReadyStatus(did);
      return;
    }
    this.startListeningCredential(did);
  }

  async startListeningReadyStatus(did) {
    console.log('Start listening for PA-accounts Ready Status...');
    this.updateService
      .checkReadyStatus(this.currentProgram.id, did)
      .then(() => {
        this.skipCredentialHandling();
      });
  }

  skipCredentialHandling() {
    this.credentialReceived = true;
    this.credentialStored = true;
    this.complete();
  }

  async startListeningCredential(did) {
    console.log('Start listening for Credential...');
    this.updateService.checkCredential(this.currentProgram.id, did).then(() => {
      this.getCredential(did);
    });
  }

  async getCredential(did: string) {
    console.log('getCredential()');
    this.programsService.getCredential(did).subscribe((response) => {
      const credential = response;
      console.log('credential Received:', credential);
      this.credentialReceived = true;
      this.storeCredential(credential);
    });
  }

  async storeCredential(credential) {
    this.conversationService.startLoading();
    console.log('Trying to store this credential', credential);
    const wallet = await this.paData.retrieve(this.paData.type.wallet);
    const credentialRequest = await this.paData.retrieve(
      this.paData.type.credentialRequest,
    );
    const credDefID = await this.paData.retrieve(this.paData.type.credDefId);
    const credentialFormat = JSON.parse(credential.message);

    await this.sovrinService
      .storeCredential(
        credDefID,
        credentialRequest.credentialRequestMetadata,
        credentialFormat.credential,
        wallet,
      )
      .then(() => {
        this.deleteCredential();
      });
    this.credentialStored = true;
    this.conversationService.stopLoading();
    this.complete();
  }

  async deleteCredential() {
    const did = await this.paData.retrieve(this.paData.type.did);
    this.programsService.deleteCredential(did);
  }

  getNextSection() {
    return PersonalComponents.handleProof;
  }

  complete() {
    if (this.isDisabled) {
      return;
    }

    this.isDisabled = true;
    this.conversationService.onSectionCompleted({
      name: PersonalComponents.storeCredential,
      data: {
        credentialReceived: this.credentialReceived,
        credentialStored: this.credentialStored,
      },
      next: this.getNextSection(),
    });
  }

  cancel() {
    this.isCanceled = true;
    this.conversationService.onSectionCompleted({
      name: PersonalComponents.storeCredential,
      data: {
        isCanceled: this.isCanceled,
      },
      next: this.getNextSection(),
    });
  }
}

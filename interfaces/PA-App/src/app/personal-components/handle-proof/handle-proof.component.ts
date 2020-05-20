import { Component, Input } from '@angular/core';

import { ConversationService } from 'src/app/services/conversation.service';
import { PaDataService } from 'src/app/services/padata.service';
import { UpdateService } from 'src/app/services/update.service';

import { SovrinService } from 'src/app/services/sovrin.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';

import { PersonalComponents } from '../personal-components.enum';
import { PersonalComponent } from '../personal-component.class';
import { Program } from 'src/app/models/program.model';

enum InclusionStates {
  included = 'included',
  excluded = 'excluded',
  unavailable = 'unavailable'
}

@Component({
  selector: 'app-handle-proof',
  templateUrl: './handle-proof.component.html',
  styleUrls: ['./handle-proof.component.scss'],
})
export class HandleProofComponent extends PersonalComponent {
  @Input()
  public data: any;

  public currentProgram: Program;
  private programId: number;
  private did: string;
  private wallet: any;

  public hasNotificationNumberSet: boolean;

  public inclusionStatus: string;
  public inclusionStatusPositive = false;
  public inclusionStatusNegative = false;

  constructor(
    public conversationService: ConversationService,
    public paData: PaDataService,
    public updateService: UpdateService,
    public programService: ProgramsServiceApiService,
    public sovrinService: SovrinService,
  ) {
    super();

    this.conversationService.startLoading();
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
    this.hasNotificationNumberSet = !!await this.paData.retrieve(this.paData.type.phoneNumber);
    this.handleProof();
  }

  initHistory() {
    this.isDisabled = true;
    this.inclusionStatus = this.data.inclusionStatus;
    this.hasNotificationNumberSet = this.data.hasNotificationNumberSet;
    this.processStatus(this.inclusionStatus);
  }

  async handleProof() {
    console.log('handleProof');

    await this.gatherData();
    const currentProgram: Program = this.paData.myPrograms[this.programId];

    if (!currentProgram) {
      return;
    }

    // Check if the enrollment was done earlier ..
    let statusRetrieved: string, status: string;
    try {
      statusRetrieved = await this.paData.retrieve('status');
    } catch {
      statusRetrieved = '';
    }
    if (!statusRetrieved) {
      // .. IF NO, THEN:
      // Create proof
      const proofRequest = await this.programService.getProofRequest(this.programId);
      const proof = await this.sovrinService.getProofFromWallet(proofRequest, this.wallet);

      // Use proof
      status = await this.programService.includeMe(this.did, this.programId, proof['proof']);
      this.paData.store('status', status);
    } else {
      // .. IF YES, THEN CONTINUE
      status = statusRetrieved;
    }

    if (status === 'done') {
      this.inclusionStatus = await this.programService.checkInclusionStatus(this.did, this.programId).toPromise();
      this.processStatus(this.inclusionStatus);
      this.conversationService.stopLoading();
      this.complete();
    } else {
      this.conversationService.stopLoading();
      this.updateService.checkInclusionStatus(this.programId, this.did).then(() => {
        this.getInclusionStatus(this.did, this.programId);
      });
    }


  }

  private async processStatus(inclusionStatus: string) {
    if (inclusionStatus === InclusionStates.included) {
      this.inclusionStatusPositive = true;
    } else if (inclusionStatus === InclusionStates.excluded) {
      this.inclusionStatusNegative = true;
    }
  }



  private async gatherData() {
    this.programId = Number(await this.paData.retrieve(this.paData.type.programId));
    this.did = await this.paData.retrieve(this.paData.type.did);
    this.wallet = await this.paData.retrieve(this.paData.type.wallet);
  }

  async getInclusionStatus(did: string, programId: number) {
    console.log('getInclusionStatus()');
    this.programService.checkInclusionStatus(did, programId).subscribe(response => {
      this.inclusionStatus = response;
      console.log('Status Received:', this.inclusionStatus);
      this.processStatus(this.inclusionStatus);
      this.conversationService.stopLoading();
      this.complete();
    });
  }

  getNextSection() {
    return '';
  }

  complete() {
    this.conversationService.onSectionCompleted({
      name: PersonalComponents.handleProof,
      data: {
        inclusionStatus: this.inclusionStatus,
        hasNotificationNumberSet: this.hasNotificationNumberSet,
      },
      next: this.getNextSection(),
    });
  }
}

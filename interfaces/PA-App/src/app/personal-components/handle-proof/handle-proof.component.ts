import { Component, Input } from '@angular/core';
import {
  PaCredentialStatus,
  PaInclusionStates,
} from 'src/app/models/pa-statuses.enum';
import { Program } from 'src/app/models/program.model';
import { ConversationService } from 'src/app/services/conversation.service';
import { PaDataService } from 'src/app/services/padata.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { SovrinService } from 'src/app/services/sovrin.service';
import { UpdateService } from 'src/app/services/update.service';
import { PersonalComponent } from '../personal-component.class';
import { PersonalComponents } from '../personal-components.enum';

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

    await this.initNew();
  }

  async initNew() {
    this.hasNotificationNumberSet = !!(await this.paData.retrieve(
      this.paData.type.phoneNumber,
    ));
    this.handleProof();
  }

  async checkValidationSkipped() {
    const inclusionStatus = await this.programService
      .checkInclusionStatus(this.did, this.programId)
      .toPromise();

    return (
      inclusionStatus === PaInclusionStates.included ||
      inclusionStatus === PaInclusionStates.rejected
    );
  }

  async handleProof() {
    console.log('handleProof');

    await this.gatherData();

    if (!this.currentProgram) {
      return;
    }

    let status: string;
    const validationSkipped = await this.checkValidationSkipped();
    console.log('validationSkipped: ', validationSkipped);

    if (validationSkipped || !this.currentProgram.validation) {
      status = PaCredentialStatus.noValidation;
    } else {
      // Check if the enrollment was done earlier ..
      let statusRetrieved: string;
      try {
        statusRetrieved = await this.paData.retrieve(this.paData.type.status);
      } catch {
        statusRetrieved = '';
      }
      if (!statusRetrieved) {
        // .. IF NO, THEN:
        // Create proof
        const proofRequest = await this.programService.getProofRequest(
          this.programId,
        );
        const proof = await this.sovrinService.getProofFromWallet(
          proofRequest,
          this.wallet,
        );

        // Use proof
        status = await this.programService.includeMe(
          this.did,
          this.programId,
          proof.proof,
        );
        this.paData.store(this.paData.type.status, status);
      } else {
        // .. IF YES, THEN CONTINUE
        status = statusRetrieved;
      }
    }

    if (status === PaCredentialStatus.done) {
      await this.handleInclusionStatus(this.did, this.programId);
      this.complete();
    } else {
      this.conversationService.stopLoading();
      this.updateService
        .checkInclusionStatus(this.programId, this.did)
        .then(() => {
          this.handleInclusionStatus(this.did, this.programId);
        });
    }
  }

  private async processStatus(inclusionStatus: string) {
    if (inclusionStatus === PaInclusionStates.included) {
      this.inclusionStatusPositive = true;
    } else if (inclusionStatus === PaInclusionStates.rejected) {
      this.inclusionStatusNegative = true;
    }
  }

  private async gatherData() {
    this.programId = await this.paData.getCurrentProgramId();
    this.did = await this.paData.retrieve(this.paData.type.did);
    this.wallet = await this.paData.retrieve(this.paData.type.wallet);
  }

  async handleInclusionStatus(did: string, programId: number) {
    this.inclusionStatus = await this.programService
      .checkInclusionStatus(did, programId)
      .toPromise();
    this.processStatus(this.inclusionStatus);
    this.conversationService.stopLoading();
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

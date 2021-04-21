import { Component, Input } from '@angular/core';
import {
  PaCredentialStatus,
  PaInclusionStates,
} from 'src/app/models/pa-statuses.enum';
import { Program } from 'src/app/models/program.model';
import { ConversationService } from 'src/app/services/conversation.service';
import { PaDataService } from 'src/app/services/padata.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
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
  private referenceId: string;

  public hasNotificationNumberSet: boolean;

  private inclusionStatus: string;
  public inclusionStatusPositive = false;
  public inclusionStatusNegative = false;

  constructor(
    public conversationService: ConversationService,
    public paData: PaDataService,
    public updateService: UpdateService,
    public programService: ProgramsServiceApiService,
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

  initHistory() {
    this.hasNotificationNumberSet = this.data.hasNotificationNumberSet;
    this.processStatus(this.data.inclusionStatus);
  }

  async initNew() {
    this.hasNotificationNumberSet = !!(await this.paData.retrieve(
      this.paData.type.phoneNumber,
    ));
    this.handleProof();
  }

  private async checkValidationSkipped() {
    const inclusionStatus = await this.programService
      .checkInclusionStatus(this.referenceId, this.programId)
      .toPromise();
    console.log('inclusionStatus: ', inclusionStatus);

    return [
      PaInclusionStates.included,
      PaInclusionStates.rejected,
      PaInclusionStates.inclusionEnded,
    ].includes(inclusionStatus);
  }

  private async handleProof() {
    await this.gatherData();

    if (!this.currentProgram) {
      return;
    }

    let status: string;
    const validationSkipped = await this.checkValidationSkipped();

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
        this.paData.store(this.paData.type.status, status);
      } else {
        // .. IF YES, THEN CONTINUE
        status = statusRetrieved;
      }
    }

    if (status === PaCredentialStatus.done) {
      await this.handleInclusionStatus(this.referenceId, this.programId);
      this.complete();
    } else {
      this.conversationService.stopLoading();
      this.updateService
        .checkInclusionStatus(this.programId, this.referenceId)
        .then(() => {
          this.handleInclusionStatus(this.referenceId, this.programId);
        });
    }
  }

  private async processStatus(inclusionStatus: string) {
    if (inclusionStatus === PaInclusionStates.included) {
      this.inclusionStatusPositive = true;
    } else if (
      inclusionStatus === PaInclusionStates.rejected ||
      inclusionStatus === PaInclusionStates.inclusionEnded
    ) {
      this.inclusionStatusNegative = true;
    }
  }

  private async gatherData() {
    this.programId = await this.paData.getCurrentProgramId();
    this.referenceId = await this.paData.retrieve(this.paData.type.referenceId);
  }

  async handleInclusionStatus(referenceId: string, programId: number) {
    this.inclusionStatus = await this.programService
      .checkInclusionStatus(referenceId, programId)
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

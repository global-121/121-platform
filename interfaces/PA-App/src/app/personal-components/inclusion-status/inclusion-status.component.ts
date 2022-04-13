import { Component, Input } from '@angular/core';
import { PaInclusionStates } from 'src/app/models/pa-statuses.enum';
import { ConversationService } from 'src/app/services/conversation.service';
import { PaDataService } from 'src/app/services/padata.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { UpdateService } from 'src/app/services/update.service';
import { PersonalDirective } from '../personal-component.class';

@Component({
  selector: 'app-inclusion-status',
  templateUrl: './inclusion-status.component.html',
  styleUrls: ['./inclusion-status.component.scss'],
})
export class InclusionStatusComponent extends PersonalDirective {
  @Input()
  public data: any;

  public hasValidation: boolean;
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
  }

  async ngOnInit() {
    const currentProgram = await this.paData.getCurrentProgram();
    this.hasValidation = currentProgram && currentProgram.validation;

    // No initHistory, because this is last section and latest inclusionStatus is always retrieved
    await this.initNew();
  }

  async initNew() {
    this.hasNotificationNumberSet = !!(await this.paData.retrieve(
      this.paData.type.phoneNumber,
    ));

    if (!this.isOnline) {
      return;
    }

    this.checkInclusionStatus();
  }

  private async checkInclusionStatus() {
    if (!navigator.onLine) {
      return;
    }

    this.programId = await this.paData.getCurrentProgramId();
    this.referenceId = await this.paData.retrieve(this.paData.type.referenceId);

    this.updateService
      .checkInclusionStatus(this.programId, this.referenceId)
      .then(() => {
        this.handleInclusionStatus(this.referenceId, this.programId);
      });
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

  async handleInclusionStatus(referenceId: string, programId: number) {
    this.inclusionStatus = await this.programService
      .checkInclusionStatus(referenceId, programId)
      .toPromise();
    this.processStatus(this.inclusionStatus);
  }

  getNextSection() {
    return '';
  }

  complete() {
    // Section does not need to be stored, because you always get latest inclusionStatus
    // No next section, as it's the last section
  }
}

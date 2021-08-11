import { Component, Input } from '@angular/core';
import { Program } from 'src/app/models/program.model';
import { Timeslot } from 'src/app/models/timeslot.model';
import { ConversationService } from 'src/app/services/conversation.service';
import { PaDataService } from 'src/app/services/padata.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { TranslatableStringService } from 'src/app/services/translatable-string.service';
import { PersonalComponent } from '../personal-component.class';
import { PersonalComponents } from '../personal-components.enum';

@Component({
  selector: 'app-registration-summary',
  templateUrl: './registration-summary.component.html',
  styleUrls: ['./registration-summary.component.scss'],
})
export class RegistrationSummaryComponent extends PersonalComponent {
  @Input()
  public data: any;

  public validation: boolean;

  public registrationStatus: boolean;

  private referenceId: string;

  public dateFormat = 'EEE, dd-MM-yyyy';
  public timeFormat = 'HH:mm';

  public program: Program;
  public meetingDocuments: string[];

  public chosenTimeslot: Timeslot;
  public daysToMeeting: number;

  public showQrCode: boolean;
  public qrDataString: string;

  constructor(
    public conversationService: ConversationService,
    public programsService: ProgramsServiceApiService,
    public translatableString: TranslatableStringService,
    public paData: PaDataService,
  ) {
    super();
  }

  ngOnInit() {
    if (this.data) {
      this.initHistory();
      return;
    }
    this.initNew();
  }

  async initNew() {
    this.conversationService.startLoading();

    this.validation = await this.checkValidation();

    await this.getReferenceId();
    await this.getProgram();

    this.registrationStatus = await this.programsService.postRegistration(
      this.referenceId,
    );

    if (this.validation) {
      await this.shouldShowQrCode();
      await this.generateContent();
    }

    this.conversationService.stopLoading();

    this.complete();
  }

  async initHistory() {
    this.isDisabled = this.data.isDisabled;

    // There is no difference between first use and future use of this component:
    this.initNew();
  }

  async checkValidation() {
    const currentProgram = await this.paData.getCurrentProgram();
    return currentProgram.validation;
  }

  private async shouldShowQrCode() {
    this.showQrCode = !(await this.paData.retrieve(
      this.paData.type.usePreprintedQrCode,
    ));
  }

  private async getReferenceId() {
    this.referenceId = await this.paData.retrieve(this.paData.type.referenceId);
  }

  private async getProgram() {
    this.program = await this.paData.getCurrentProgram();
    this.getProgramProperties(this.program);
  }

  private getProgramProperties(program: Program) {
    const documents = this.translatableString.get(program.meetingDocuments);
    this.meetingDocuments = this.buildDocumentsList(documents);
  }

  private buildDocumentsList(documents: string): string[] {
    return documents.split(';');
  }

  private generateQrCode(referenceId: string, programId: number) {
    const qrData = {
      referenceId,
      programId,
    };

    this.qrDataString = JSON.stringify(qrData);
  }

  public async generateContent() {
    this.generateQrCode(this.referenceId, this.program.id);
  }

  public retry() {
    window.location.reload();
  }

  getNextSection() {
    return PersonalComponents.monitoringQuestion;
  }

  complete() {
    if (this.isDisabled) {
      return;
    }

    this.isDisabled = true;
    this.conversationService.onSectionCompleted({
      name: PersonalComponents.registrationSummary,
      data: {
        isDisabled: this.isDisabled,
      },
      next: this.getNextSection(),
    });
  }
}

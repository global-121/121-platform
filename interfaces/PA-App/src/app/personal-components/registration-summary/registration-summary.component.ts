import { Component, Input } from '@angular/core';
import { Program } from 'src/app/models/program.model';
import { PaRegistrationModes } from 'src/app/models/route-parameters';
import { Timeslot } from 'src/app/models/timeslot.model';
import { ConversationService } from 'src/app/services/conversation.service';
import { PaDataService } from 'src/app/services/padata.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { TranslatableStringService } from 'src/app/services/translatable-string.service';
import { PersonalDirective } from '../personal-component.class';
import { PersonalComponents } from '../personal-components.enum';

@Component({
  selector: 'app-registration-summary',
  templateUrl: './registration-summary.component.html',
  styleUrls: ['./registration-summary.component.scss'],
})
export class RegistrationSummaryComponent extends PersonalDirective {
  @Input()
  public data: any;

  public validation: boolean;
  public validationByQr: boolean;

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

    await this.checkValidation();

    await this.getReferenceId();
    await this.getProgram();

    this.registrationStatus = await this.programsService.postRegistration(
      this.referenceId,
    );

    if (this.validation && this.validationByQr) {
      await this.shouldShowQrCode();
      await this.generateContent();
    }

    this.conversationService.stopLoading();

    this.complete();
  }

  async initHistory() {
    this.isDisabled = this.data.isDisabled;
    this.validation = this.data.validation;
    this.registrationStatus = this.data.registrationStatus;
    this.meetingDocuments = this.data.meetingDocuments;
  }

  async checkValidation() {
    const currentProgram = await this.paData.getCurrentProgram();
    this.validation = currentProgram.validation;
    this.validationByQr = currentProgram.validationByQr;
  }

  private async shouldShowQrCode() {
    const usePreprintedQrCodeData = await this.paData.retrieve(
      this.paData.type.usePreprintedQrCode,
    );
    if (typeof usePreprintedQrCodeData !== undefined) {
      this.showQrCode = !JSON.parse(usePreprintedQrCodeData);
    } else {
      this.showQrCode = false;
    }
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
    return this.mode === PaRegistrationModes.batch
      ? PersonalComponents.nextPa
      : PersonalComponents.monitoringQuestion;
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
        validation: this.validation,
        registrationStatus: this.registrationStatus,
        meetingDocuments: this.meetingDocuments,
      },
      next: this.getNextSection(),
    });
  }
}

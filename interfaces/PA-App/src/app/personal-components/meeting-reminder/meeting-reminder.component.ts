import { Component, Input } from '@angular/core';
import { PersonalComponent } from '../personal-component.class';
import { PersonalComponents } from '../personal-components.enum';

import { ConversationService } from 'src/app/services/conversation.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { TranslateService } from '@ngx-translate/core';
import { PaDataService } from 'src/app/services/padata.service';

import { Timeslot } from 'src/app/models/timeslot.model';
import { Program } from 'src/app/models/program.model';

@Component({
  selector: 'app-meeting-reminder',
  templateUrl: './meeting-reminder.component.html',
  styleUrls: ['./meeting-reminder.component.scss'],
})
export class MeetingReminderComponent extends PersonalComponent {
  @Input()
  public data: any;

  private did: string;
  public languageCode: string;
  public fallbackLanguageCode: string;

  public dateFormat = 'EEE, dd-MM-yyyy';
  public timeFormat = 'HH:mm';

  public program: Program;
  public meetingDocuments: string[];

  public chosenTimeslot: Timeslot;
  public daysToMeeting: number;

  public qrDataString: string;
  public qrDataShow = false;

  constructor(
    public conversationService: ConversationService,
    public programsService: ProgramsServiceApiService,
    public translate: TranslateService,
    public paData: PaDataService,
  ) {
    super();

    this.fallbackLanguageCode = this.translate.getDefaultLang();
    this.languageCode = this.translate.currentLang;
  }

  ngOnInit() {
    if (this.data) {
      this.initHistory();
      return;
    }
    this.initNew();
  }

  async initNew() {
    await this.getDid();
    await this.getProgram();
    await this.generateContent();
  }

  async initHistory() {
    this.isDisabled = this.data.isDisabled;

    // There is no difference between first use and future use of this component:
    this.initNew();
  }

  private async getDid() {
    this.did = await this.paData.retrieve(this.paData.type.did);
  }

  private async getProgram() {
    this.conversationService.startLoading();
    this.program = await this.paData.getCurrentProgram();
    this.getProgramProperties(this.program);
  }

  private getProgramProperties(program: Program) {
    const documents = this.mapLabelByLanguageCode(program.meetingDocuments);
    this.meetingDocuments = this.buildDocumentsList(documents);
  }

  private mapLabelByLanguageCode(property: any) {
    let label = property[this.languageCode];

    if (!label) {
      label = property[this.fallbackLanguageCode];
    }

    if (!label) {
      label = property;
    }

    return label;
  }

  private buildDocumentsList(documents: string): string[] {
    return documents.split(';');
  }

  private generateQrCode(did: string, programId: number) {
    const qrData = {
      did,
      programId,
    };

    this.qrDataString = JSON.stringify(qrData);
    this.qrDataShow = true;
  }

  private getDaysToAppointment(appointmentDate: Date) {
    const currentDate = new Date();
    const chosenDate = new Date(appointmentDate);
    const oneDay = 24 * 60 * 60 * 1000; // hours * minutes * seconds * milliseconds

    currentDate.setHours(0, 0, 0, 0);
    chosenDate.setHours(0, 0, 0, 0);

    const diff = chosenDate.getTime() - currentDate.getTime();

    return Math.round(Math.abs(diff / oneDay));
  }

  public async generateContent() {
    this.conversationService.startLoading();

    this.generateQrCode(this.did, this.program.id);

    this.chosenTimeslot = await this.paData.retrieve(this.paData.type.timeslot);
    this.daysToMeeting = this.getDaysToAppointment(this.chosenTimeslot.startDate);

    this.conversationService.stopLoading();
    this.complete();
  }

  getNextSection() {
    return PersonalComponents.storeCredential;
  }

  complete() {
    if (this.isDisabled) {
      return;
    }

    this.isDisabled = true;
    this.conversationService.onSectionCompleted({
      name: PersonalComponents.meetingReminder,
      data: {
        isDisabled: this.isDisabled,
      },
      next: this.getNextSection(),
    });
  }

}

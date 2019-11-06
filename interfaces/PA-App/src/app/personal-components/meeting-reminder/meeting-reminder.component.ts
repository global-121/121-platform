import { Component } from '@angular/core';
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
  private did: string;
  public languageCode: string;
  public fallbackLanguageCode: string;
  public dateFormat = 'EEE, dd-MM-yyyy';
  public timeFormat = 'HH:mm';

  public program: Program;
  public ngo: string;
  private programChoice: number;

  public timeslots: Timeslot[];
  public timeslotChoice: number;
  public chosenTimeslot: Timeslot;
  public daysToMeeting: string;
  public meetingTomorrow: boolean;
  public meetingToday: boolean;
  public meetingPast: boolean;

  public timeslotSubmitted: boolean;

  public confirmAction: string;

  public meetingDocuments: string[];

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
    this.getProgram();
  }

  ngOnInit() {
    this.generateContent();
    this.getDaysToAppointment();
  }

  private async getDid() {
    this.paData.retrieve(this.paData.type.did).then((value) => {
      this.did = value;
    });
  }

  private async getProgram() {
    this.conversationService.startLoading();
    this.paData.retrieve(this.paData.type.programId).then(programId => {
      this.programChoice = Number(programId);
      this.getProgramProperties(programId);
    });
  }

  private getProgramProperties(programId) {
    this.program = this.paData.myPrograms[programId];

    if (!this.program) {
      return;
    }

    const documents = this.mapLabelByLanguageCode(this.program.meetingDocuments);
    this.meetingDocuments = this.buildDocumentsList(documents);
  }

  private mapLabelByLanguageCode(property: any) {
    let label = property[this.languageCode];

    if (!label) {
      label = property[this.fallbackLanguageCode];
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

    if (qrData) {
      this.qrDataString = JSON.stringify(qrData);
      this.qrDataShow = true;
    }
  }

  private getDaysToAppointment() {
    if (this.qrDataShow) {
      let daysToMeetingNumber: number;

      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      const chosenDate = new Date(this.chosenTimeslot.startDate.valueOf());
      chosenDate.setHours(0, 0, 0, 0);
      const diff = chosenDate.getTime() - currentDate.getTime();
      daysToMeetingNumber = Math.ceil(diff / (1000 * 3600 * 24));
      this.daysToMeeting = String(daysToMeetingNumber);
      this.meetingTomorrow = daysToMeetingNumber === 1 ? true : false;
      this.meetingToday = daysToMeetingNumber === 0 ? true : false;
      this.meetingPast = daysToMeetingNumber < 0 ? true : false;
    }
  }

  public async generateContent() {
    this.conversationService.startLoading();
    this.paData.retrieve(this.paData.type.timeslot).then(async (value) => {
      this.chosenTimeslot = value;
      console.log(this.chosenTimeslot);
      await this.getDid();
      await this.getProgram();

      await this.generateQrCode(this.did, this.programChoice);
      await this.getDaysToAppointment();

      this.conversationService.stopLoading();
      this.complete();
    });
  }

  getNextSection() {
    return PersonalComponents.storeCredential;
  }

  complete() {
    this.isDisabled = true;
    this.conversationService.onSectionCompleted({
      name: PersonalComponents.selectAppointment,
      data: {
        timeslot: this.chosenTimeslot,
      },
      next: this.getNextSection(),
    });
  }

}

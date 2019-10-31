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
  selector: 'app-select-appointment',
  templateUrl: './select-appointment.component.html',
  styleUrls: ['./select-appointment.component.scss'],
})
export class SelectAppointmentComponent extends PersonalComponent {
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
    this.getDid();
    this.getDaysToAppointment();
  }

  private getDid() {
    this.paData.retrieve(this.paData.type.did).then((value) => {
      this.did = value;
    });
  }

  private getProgram() {
    this.conversationService.startLoading();
    this.paData.retrieve(this.paData.type.programId).then(programId => {
      this.programChoice = Number(programId);
      this.getProgramProperties(programId);
      this.getTimeslots(programId);
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

  private getTimeslots(programId: any) {
    this.programsService.getTimeslots(programId).subscribe((response: Timeslot[]) => {
      this.timeslots = response;
      console.log('timeslots: ', this.timeslots);

      this.conversationService.stopLoading();
    });
  }

  public isSameDay(startDate: string, endDate: string) {
    const startDay = new Date(startDate).toDateString();
    const endDay = new Date(endDate).toDateString();

    return (startDay === endDay);
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

  private storeTimeslot(timeslotChoice: any) {
    this.paData.store(this.paData.type.timeslot, timeslotChoice);
  }

  private getTimeslotById(timeslotId: number) {
    return this.timeslots.find((item: Timeslot) => item.id === timeslotId);
  }

  public changeTimeslot($event) {
    this.timeslotChoice = parseInt($event.detail.value, 10);
    this.timeslotSubmitted = false;

    this.chosenTimeslot = this.getTimeslotById(this.timeslotChoice);
    this.storeTimeslot(this.timeslotChoice);
  }

  public submitTimeslot() {
    this.timeslotSubmitted = true;
    this.conversationService.scrollToEnd();
  }

  public changeConfirmAction($event) {
    this.confirmAction = $event.detail.value;
  }

  public submitConfirmAction(action: string) {
    // This needs a check on 'already confirmed for this did' (max 1 timeslot-selection allowed)
    if (action === 'confirm') {
      this.postAppointment(this.timeslotChoice, this.did, this.programChoice);
    } else if (action === 'change') {
      this.timeslotSubmitted = false;
      this.isDisabled = false;
    }
  }

  public postAppointment(timeslotId: number, did: string, programId: number) {
    this.conversationService.startLoading();
    this.programsService.postAppointment(timeslotId, did).subscribe(() => {

      this.generateQrCode(did, programId);
      this.getDaysToAppointment();

      this.conversationService.stopLoading();
      this.complete();
    });
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

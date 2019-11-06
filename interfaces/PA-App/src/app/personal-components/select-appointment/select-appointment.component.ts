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
  public programChoice: number;

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

  private storeTimeslot(chosenTimeslot: any) {
    this.paData.store(this.paData.type.timeslot, chosenTimeslot);
  }

  private getTimeslotById(timeslotId: number) {
    return this.timeslots.find((item: Timeslot) => item.id === timeslotId);
  }

  public changeTimeslot($event) {
    this.timeslotChoice = parseInt($event.detail.value, 10);
    this.timeslotSubmitted = false;

    this.chosenTimeslot = this.getTimeslotById(this.timeslotChoice);
    this.storeTimeslot(this.chosenTimeslot);
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
      this.postAppointment(this.timeslotChoice, this.did);
    } else if (action === 'change') {
      this.timeslotSubmitted = false;
      this.isDisabled = false;
    }
  }

  public postAppointment(timeslotId: number, did: string) {
    this.conversationService.startLoading();
    this.programsService.postAppointment(timeslotId, did).subscribe(() => {
      this.conversationService.stopLoading();
      this.complete();
    });
  }


  getNextSection() {
    return PersonalComponents.phoneNumber;
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

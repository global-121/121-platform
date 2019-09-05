import { Component, OnInit } from '@angular/core';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { TranslateService } from '@ngx-translate/core';
import { Storage } from '@ionic/storage';

@Component({
  selector: 'app-select-appointment',
  templateUrl: './select-appointment.component.html',
  styleUrls: ['./select-appointment.component.scss'],
})
export class SelectAppointmentComponent implements OnInit {
  public languageCode: string;
  public fallbackLanguageCode: string;

  public timeslots: any;
  public timeslotChoice: number;
  public timeslotSubmitted: boolean;
  public timeslotChoiceName: any;
  public confirmOptions: any;
  public confirmOptionChoice: number;
  public appointmentConfirmed: boolean;

  public meetingDocuments: any;
  public ngo: string;

  constructor(
    public programsService: ProgramsServiceApiService,
    public translate: TranslateService,
    public storage: Storage,
  ) {
    this.fallbackLanguageCode = this.translate.getDefaultLang();
  }

  ngOnInit() {
    this.confirmOptions = [
      { id: 1, option: this.translate.instant('personal.select-appointment.option1') },
      { id: 2, option: this.translate.instant('personal.select-appointment.option2') },
    ];
    this.getLanguageChoice();
    this.getProgramProperties();
  }

  private getLanguageChoice() {
    this.storage.get('languageChoice').then(value => {
      this.languageCode = value;
    });
  }

  public getTimeslots(): any {
    this.storage.get('programChoice').then(value => {
      this.programsService.getTimeslots(value).subscribe(response => {
        this.timeslots = response[0];
      });
    });
  }

  public getProgramProperties(): any {
    this.storage.get('programChoice').then(value => {
      this.programsService.getProgramById(value).subscribe(response => {
        this.meetingDocuments = this.mapLabelByLanguageCode(response.meetingDocuments).split(';');
        this.ngo = response.ngo;
      });
    });
  }

  private mapLabelByLanguageCode(property: any) {
    let label = property[this.languageCode];

    if (!label) {
      label = property[this.fallbackLanguageCode];
    }

    return label;
  }

  public getTimeslotName(timeslotId: number): string {
    const timeslot = this.timeslots.find(item => {
      return item.id === timeslotId;
    });

    return timeslot ? timeslot.startDate.concat(' - ', timeslot.endDate, ' (', timeslot.location, ')') : '';
  }

  private setTimeslotChoiceName(timeslotChoice: string) {
    const timeslotId = parseInt(timeslotChoice, 10);

    this.timeslotChoiceName = this.getTimeslotName(timeslotId);
  }

  private storeTimeslot(timeslotChoice: any) {
    this.storage.set('timeslotChoice', timeslotChoice);
  }

  public changeTimeslot($event) {
    this.timeslotSubmitted = false;
    const timeslotChoice = $event.detail.value;
    this.timeslotChoice = timeslotChoice;
    this.storeTimeslot(timeslotChoice);
    this.setTimeslotChoiceName(timeslotChoice);
  }

  public submitTimeslot() {
    this.timeslotSubmitted = true;
  }

  public changeConfirmOption($event) {
    const confirmOptionChoice = $event.detail.value;
    this.confirmOptionChoice = confirmOptionChoice;
  }

  public postAppointment(did: string): any {
    this.storage.get('timeslotChoice').then(value => {
      this.programsService.postAppointment(value, did).subscribe(response => {
        console.log('response: ', response);
        this.appointmentConfirmed = true;
      });
    });
  }

  public submitAppointment(confirmOptionChoice) {
    // This needs a check on 'already confirmed for this did' (max 1 timeslot-selection allowed)
    // tslint:disable: triple-equals
    if (confirmOptionChoice == 1) {
      this.postAppointment('did:sov:1235j123lk5');
    } else if (confirmOptionChoice == 2) {
      this.timeslotSubmitted = false;
      this.appointmentConfirmed = false;
    }
  }

}

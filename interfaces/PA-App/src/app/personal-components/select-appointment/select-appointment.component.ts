import { Component, OnInit } from '@angular/core';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { Storage } from '@ionic/storage';
import { CustomTranslateService } from 'src/app/services/custom-translate.service';

@Component({
  selector: 'app-select-appointment',
  templateUrl: './select-appointment.component.html',
  styleUrls: ['./select-appointment.component.scss'],
})
export class SelectAppointmentComponent implements OnInit {
  public timeslots: any;
  public timeslotChoice: number;
  public timeslotSubmitted: boolean;
  public timeslotChoiceName: any;
  public confirmOptions: any;
  public confirmOptionChoice: number;
  public appointmentConfirmed: boolean;

  constructor(
    public programsService: ProgramsServiceApiService,
    public customTranslateService: CustomTranslateService,
    public storage: Storage,
  ) { }

  ngOnInit() {
    this.confirmOptions = [
      { id: 1, option: this.customTranslateService.translate('personal.select-appointment.option1') },
      { id: 2, option: this.customTranslateService.translate('personal.select-appointment.option2') },
    ];
  }

  public getTimeslots(): any {
    this.storage.get('programChoice').then(value => {
      this.programsService.getTimeslots(value).subscribe(response => {
        this.timeslots = response[0];
      });
    });
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

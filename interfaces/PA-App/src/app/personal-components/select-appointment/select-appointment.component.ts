import { Component, OnInit } from '@angular/core';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { Storage } from '@ionic/storage';

@Component({
  selector: 'app-select-appointment',
  templateUrl: './select-appointment.component.html',
  styleUrls: ['./select-appointment.component.scss'],
})
export class SelectAppointmentComponent implements OnInit {
  public timeslots: any;
  public timeslotChoice: number;
  constructor(
    public programsService: ProgramsServiceApiService,
    public storage: Storage,
  ) { }

  ngOnInit() { }

  public getTimeslots(): any {
    this.storage.get('programChoice').then(value => {
      this.programsService.getTimeslots(value).subscribe(response => {
        this.timeslots = response[0];
      });
    });
  }

  private storeTimeslot(timeslotChoice: any) {
    this.storage.set('timeslotChoice', timeslotChoice);
  }

  public changeTimeslot($event) {
    const timeslotChoice = $event.detail.value;
    this.timeslotChoice = timeslotChoice;
    this.storeTimeslot(timeslotChoice);
  }

  public postAppointment(did: string): any {
    this.storage.get('timeslotChoice').then(value => {
      this.programsService.postAppointment(value, did).subscribe(response => {
        console.log('response: ', response);
      });
    });
  }

}

import { Component, OnInit } from '@angular/core';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';

@Component({
  selector: 'app-view-appointments',
  templateUrl: './view-appointments.component.html',
  styleUrls: ['./view-appointments.component.scss'],
})
export class ViewAppointmentsComponent implements OnInit {
  public appointments: any;
  public timeslotChoice: number;
  public appointmentsByTimeslot: any;
  public timeslotSelected: boolean;
  public appointmentChoice: number;

  constructor(
    public programsService: ProgramsServiceApiService
  ) { }

  ngOnInit() { }

  public getAppointments() {
    this.programsService.getAppointments().subscribe(response => {
      this.appointments = response;
    });
  }

  public changeTimeslot($event) {
    const timeslotChoice = $event.detail.value;
    this.timeslotChoice = timeslotChoice;
  }

  public submitTimeslot(timeslotChoice) {
    this.appointmentsByTimeslot = this.appointments.filter(
      // tslint:disable-next-line: triple-equals
      timeslot => timeslot.timeslotId == timeslotChoice
    )[0].appointments;
    this.timeslotSelected = true;
  }

  public changeAppointment($event) {
    const appointmentChoice = $event.detail.value;
    this.appointmentChoice = appointmentChoice;
  }

  public submitAppointment(appointmentChoice) {
    console.log('Appointment with DID: ', appointmentChoice, ' selected.');
  }
}

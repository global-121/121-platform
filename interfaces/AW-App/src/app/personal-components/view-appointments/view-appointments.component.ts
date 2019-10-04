import { Component, OnInit } from '@angular/core';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { PersonalComponent } from '../personal-components.interface';
import { ConversationService } from 'src/app/services/conversation.service';
import { Storage } from '@ionic/storage';

@Component({
  selector: 'app-view-appointments',
  templateUrl: './view-appointments.component.html',
  styleUrls: ['./view-appointments.component.scss'],
})
export class ViewAppointmentsComponent implements PersonalComponent {
  public appointments: any;
  public timeslotChoice: number;
  public appointmentsByTimeslot: any;
  public timeslotSelected: boolean;
  public appointmentChoice: number;

  constructor(
    public programsService: ProgramsServiceApiService,
    public conversationService: ConversationService,
    public storage: Storage,
  ) { }

  ngOnInit() {
    this.getAppointments();
  }

  public getAppointments() {
    this.programsService.getAppointments().subscribe(response => {
      this.appointments = response;
      this.storage.set('appointments', this.appointments);
    });
  }

  public isSameDay(startDate: string, endDate: string) {
    const startDay = new Date(startDate).toDateString();
    const endDay = new Date(endDate).toDateString();

    return (startDay === endDay);
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

  public backMainMenu() {
    this.complete();
  }

  getNextSection() {
    return 'main-menu';
  }

  complete() {
    this.conversationService.onSectionCompleted({
      name: 'view-appointments',
      data: {
        appointments: this.appointments,
        timeslotChoice: this.timeslotChoice,
        appointmentsByTimeslot: this.appointmentsByTimeslot,
        timeslotSelected: this.timeslotSelected,
      },
      next: this.getNextSection(),
    });
  }
}

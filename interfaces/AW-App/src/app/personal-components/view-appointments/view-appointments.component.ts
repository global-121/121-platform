import { Component, OnInit } from '@angular/core';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { PersonalComponent } from '../personal-components.interface';
import { ConversationService } from 'src/app/services/conversation.service';

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

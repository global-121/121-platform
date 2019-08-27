import { Component, OnInit } from '@angular/core';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';

@Component({
  selector: 'app-view-appointments',
  templateUrl: './view-appointments.component.html',
  styleUrls: ['./view-appointments.component.scss'],
})
export class ViewAppointmentsComponent implements OnInit {
  public appointments: any;

  constructor(
    public programsService: ProgramsServiceApiService
  ) { }

  ngOnInit() { }

  public getAppointments() {
    this.programsService.getAppointments().subscribe(response => {
      this.appointments = response;
    });
  }

}

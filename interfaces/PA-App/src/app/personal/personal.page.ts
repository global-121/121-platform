import { Component, ViewChild } from '@angular/core';
import { IonContent } from '@ionic/angular';
import { environment } from 'src/environments/environment';

import { ProgramsServiceApiService } from '../services/programs-service-api.service';

@Component({
  selector: 'app-personal',
  templateUrl: 'personal.page.html',
  styleUrls: ['personal.page.scss'],
})
export class PersonalPage {
  @ViewChild(IonContent)
  public ionContent: IonContent;

  public isDebug: boolean = !environment.production;

  public countries: any = null;
  public countryChoice: number = null;
  public programs: any = null;
  public programChoice: number = null;
  public timeslots: any = null;



  constructor(
    public programsService: ProgramsServiceApiService,
  ) { }

  ionViewDidEnter() {
    this.scrollDown();
  }

  public getCountries(): any {
    this.programsService.getCountries().subscribe(response => {
      this.countries = response;
    });
  }

  public getAllPrograms(): any {
    this.programsService.getAllPrograms().subscribe(response => {
      this.programs = response;
    });
  }

  public getProgramsByCountryId(countryId: number): any {
    this.programsService.getProgramsByCountryId(countryId).subscribe(response => {
      this.programs = response;
    });
  }

  public getTimeslots(programId: number): any {
    this.programsService.getTimeslots(programId).subscribe(response => {
      this.timeslots = response[0];
    });
  }

  public postAppointment(timeslotId: number, did: string): any {
    this.programsService.postAppointment(timeslotId, did).subscribe(response => {
    });
  }

  scrollDown() {
    // Wait for elements to be added to the DOM before scrolling down
    setTimeout(() => {
      this.ionContent.scrollToBottom(300);
    }, 100);
  }
}

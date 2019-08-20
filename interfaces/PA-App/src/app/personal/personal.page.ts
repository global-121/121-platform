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

  public countries: any;
  public countryChoice: number;
  public countryChoiceName: string;

  public programs: any;
  public programChoice: number;
  public program: any;
  public programTitle: string;

  public timeslots: any;
  public timeslotChoice: number;

  constructor(
    public programsService: ProgramsServiceApiService,
  ) { }

  ionViewDidEnter() {
    this.scrollDown();
  }

  public getCountryName(countryId: number): string {
    const country = this.countries.find(item => {
      return item.id === countryId;
    });

    return country ? country.country : '';
  }

  public setCountryChoiceName(countryChoice: string) {
    const countryId = parseInt(countryChoice, 10);

    this.countryChoiceName = this.getCountryName(countryId);
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

  public getProgramById(programId: number): any {
    this.programsService.getProgramById(programId).subscribe(response => {
      this.program = [];
      this.programTitle = response.title;
      const details = ['description', 'distributionChannel'];
      for (const detail of details) {
        this.program.push({ key: detail, value: response[detail] });
      }
    });
  }

  public getTimeslots(programId: number): any {
    this.programsService.getTimeslots(programId).subscribe(response => {
      this.timeslots = response[0];
    });
  }

  public postAppointment(timeslotId: number, did: string): any {
    this.programsService.postAppointment(timeslotId, did).subscribe(response => {
      console.log('response: ', response);
    });
  }

  scrollDown() {
    // Wait for elements to be added to the DOM before scrolling down
    setTimeout(() => {
      this.ionContent.scrollToBottom(300);
    }, 100);
  }
}

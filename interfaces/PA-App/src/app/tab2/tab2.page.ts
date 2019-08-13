import { Component } from '@angular/core';
import { ProgramsServiceApiService } from '../services/programs-service-api.service';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  providers: [ProgramsServiceApiService]
})
export class Tab2Page {
  public countries: any = null;
  public countryChoice: number = null;
  public programs: any = null;
  constructor(
    public programsService: ProgramsServiceApiService,
  ) { }

  // public async login(email: string, password: string): Promise<void> {
  //   await this.programsService.login(email, password);
  // }

  public getCountries(): any {
    this.programsService.getCountries().subscribe(response => {
      this.countries = response;
    });
  }

  // public getAllPrograms(): any {
  //   this.programsService.getAllPrograms().subscribe(response => {
  //     this.programs = response;
  //   });
  // }

  public getProgramsByCountryId(countryId: number): any {
    this.programsService.getProgramsByCountryId(countryId).subscribe(response => {
      this.programs = response;
    });
  }


}

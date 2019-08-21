import { Component, OnInit, Input } from '@angular/core';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';

@Component({
  selector: 'app-select-country',
  templateUrl: './select-country.component.html',
  styleUrls: ['./select-country.component.scss'],
})
// export class SelectCountryComponent implements OnInit {
export class SelectCountryComponent implements OnInit {

  public countries: any;
  public countryChoice: number;
  public countryChoiceName: string;

  constructor(
    public programsService: ProgramsServiceApiService
  ) { }

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

  ngOnInit() { }

}

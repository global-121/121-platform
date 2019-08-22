import { Component, OnInit, Input } from '@angular/core';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { Storage } from '@ionic/storage';

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
    public programsService: ProgramsServiceApiService,
    public storage: Storage,
  ) { }

  public getCountryName(countryId: number): string {
    const country = this.countries.find(item => {
      return item.id === countryId;
    });

    return country ? country.country : '';
  }

  private setCountryChoiceName(countryChoice: string) {
    const countryId = parseInt(countryChoice, 10);

    this.countryChoiceName = this.getCountryName(countryId);
  }

  private storeCountry(countryChoice: any) {
    this.storage.set('countryChoice', countryChoice);
  }

  public getCountries(): any {
    this.programsService.getCountries().subscribe(response => {
      this.countries = response;
    });
  }

  public changeCountry($event) {
    const countryChoice = $event.detail.value;
    this.countryChoice = countryChoice;
    this.storeCountry(countryChoice);
    this.setCountryChoiceName(countryChoice);
  }

  ngOnInit() { }

}

import { Component, Input } from '@angular/core';
import { PersonalComponent } from '../personal-component.class';
import { PersonalComponents } from '../personal-components.enum';

import { ConversationService } from 'src/app/services/conversation.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { PaDataService } from 'src/app/services/padata.service';
import { Country } from 'src/app/models/country.model';

@Component({
  selector: 'app-select-country',
  templateUrl: './select-country.component.html',
  styleUrls: ['./select-country.component.scss'],
})
export class SelectCountryComponent extends PersonalComponent {
  @Input()
  data: any;

  public countries: Country[];
  public countryChoice: number;
  public countryChoiceName: string;

  constructor(
    public conversationService: ConversationService,
    public programsService: ProgramsServiceApiService,
    public paData: PaDataService,
  ) {
    super();
  }

  ngOnInit() {
    if (this.data) {
      this.initHistory();
      return;
    }
    this.initNew();
  }

  async initNew() {
    this.conversationService.startLoading();
    this.countries = await this.programsService.getCountries();
    this.conversationService.stopLoading();
  }

  initHistory() {
    this.isDisabled = true;
    this.countryChoice = this.data.countryChoice;
    this.countryChoiceName = this.data.countryChoiceName;
    this.countries = [{
      id: this.data.countryChoice,
      country: this.data.countryChoiceName,
    }];
  }

  private getCountryName(countryId: number): string {
    const country = this.countries.find((item: Country) => {
      return item.id === countryId;
    });

    return country ? country.country : '';
  }

  public changeCountry($event) {
    this.countryChoice = parseInt($event.detail.value, 10);
    this.countryChoiceName = this.getCountryName(this.countryChoice);
    this.paData.store(this.paData.type.country, this.countryChoice);
  }

  public submitCountry() {
    this.complete();
  }

  getNextSection(): string {
    return PersonalComponents.selectProgram;
  }

  complete() {
    this.isDisabled = true;
    this.conversationService.onSectionCompleted({
      name: PersonalComponents.selectCountry,
      data: {
        countryChoice: this.countryChoice,
        countryChoiceName: this.countryChoiceName,
      },
      next: this.getNextSection(),
    });
  }
}

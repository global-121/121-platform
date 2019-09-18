import { Component } from '@angular/core';
import { PersonalComponent } from '../personal-component.class';
import { PersonalComponents } from '../personal-components.enum';

import { ConversationService } from 'src/app/services/conversation.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { Storage } from '@ionic/storage';

@Component({
  selector: 'app-select-country',
  templateUrl: './select-country.component.html',
  styleUrls: ['./select-country.component.scss'],
})
export class SelectCountryComponent extends PersonalComponent {
  public countries: any;
  public countryChoice: number;
  public countryChoiceName: string;

  constructor(
    public conversationService: ConversationService,
    public programsService: ProgramsServiceApiService,
    public storage: Storage,
  ) {
    super();

    this.getCountries();
  }

  private getCountries(): any {
    this.conversationService.startLoading();
    this.programsService.getCountries().subscribe(response => {
      this.countries = response;
      this.conversationService.stopLoading();
    });
  }

  private getCountryName(countryId: number): string {
    const country = this.countries.find(item => {
      return item.id === countryId;
    });

    return country ? country.country : '';
  }

  private storeCountry(countryChoice: number) {
    this.storage.set('countryChoice', countryChoice);
  }

  public changeCountry($event) {
    this.countryChoice = parseInt($event.detail.value, 10);
    this.countryChoiceName = this.getCountryName(this.countryChoice);
    this.isDisabled = false;
    this.storeCountry(this.countryChoice);
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

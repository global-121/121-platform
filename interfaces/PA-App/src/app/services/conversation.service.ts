import { Injectable, Type } from '@angular/core';
import { SelectCountryComponent } from '../personal-components/select-country/select-country.component';
import { SelectProgramComponent } from '../personal-components/select-program/select-program.component';
import { GetProgramDetailsComponent } from '../personal-components/get-program-details/get-program-details.component';
import { SelectAppointmentComponent } from '../personal-components/select-appointment/select-appointment.component';
import { SelectLanguageComponent } from '../personal-components/select-language/select-language.component';

@Injectable({
  providedIn: 'root'
})
export class ComponentsItem {
  constructor(public component: any) { }
}
export class ConversationService {

  private dummyJsonResponse = {
    items: [
      {
        comp: SelectLanguageComponent
      },
      {
        comp: SelectCountryComponent
      },
      {
        comp: SelectProgramComponent
      },
      {
        comp: GetProgramDetailsComponent
      },
      {
        comp: SelectAppointmentComponent
      },
    ]
  };

  constructor() { }

  public getComponents(): ComponentsItem[] {
    const result: ComponentsItem[] = [];

    for (const item of this.dummyJsonResponse.items) {
      const newItem = new ComponentsItem(item.comp);
      result.push(newItem);
    }

    return result;
  }

}

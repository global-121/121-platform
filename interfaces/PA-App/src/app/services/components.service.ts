import { Injectable, Type } from '@angular/core';
import { SelectCountryComponent } from '../personal-components/select-country/select-country.component';
import { SelectProgramComponent } from '../personal-components/select-program/select-program.component';

@Injectable({
  providedIn: 'root'
})
export class ComponentsItem {
  constructor(public component: any) { }
}
export class ComponentsService {

  private dummyJsonResponse = {
    items: [
      {
        step: 1,
        comp: SelectCountryComponent
      },
      {
        step: 2,
        comp: SelectProgramComponent
      }
    ]
  }

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

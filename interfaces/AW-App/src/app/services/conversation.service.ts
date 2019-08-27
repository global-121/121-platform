import { Injectable, Type } from '@angular/core';
import { LoginComponent } from '../personal-components/login/login.component';
import { MainMenuComponent } from '../personal-components/main-menu/main-menu.component';
import { ViewAppointmentsComponent } from '../personal-components/view-appointments/view-appointments.component';

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
        comp: LoginComponent
      },
      {
        comp: MainMenuComponent
      },
      {
        comp: ViewAppointmentsComponent
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

import { Component } from '@angular/core';
import { Events } from '@ionic/angular';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss']
})
export class TabsPage {
  public validationDisabled = true;

  constructor(
    public events: Events
  ) {
    events.subscribe('toggleValidation', () => {
      this.validationDisabled = !this.validationDisabled;
    });

  }




}

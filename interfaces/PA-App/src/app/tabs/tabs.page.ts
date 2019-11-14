import { Component } from '@angular/core';
import { environment } from 'src/environments/environment';

import { PaDataService } from '../services/padata.service';

import { PopoverController } from '@ionic/angular';
import { UserMenuComponent } from '../user-menu/user-menu.component';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss']
})
export class TabsPage {
  public accountBtnColor = 'medium';
  public isLoggedIn = false;
  events: any;

  public useLocalStorage: boolean;

  constructor(
    public popoverController: PopoverController,
    public paData: PaDataService,
  ) {
    // Listen for completed sections, to continue with next steps
    this.paData.authenticationState$.subscribe((isLoggedIn: boolean) => {
      this.adjustAuthProperties(isLoggedIn);
    });
    this.useLocalStorage = environment.localStorage;
  }

  ngOnInit() {
    // It remembers a logged-in state from previous sessions. For development but default isLoggedIn default on false
    // this.paData.retrieve('isLoggedIn', true).then((isLoggedIn: boolean) => {
    //   this.adjustAuthProperties(isLoggedIn);
    // });
  }

  adjustAuthProperties(isLoggedIn) {
    this.isLoggedIn = isLoggedIn;
    this.accountBtnColor = this.isLoggedIn ? 'success' : 'medium';
  }

  async openUserMenu(ev: any) {
    const popover = await this.popoverController.create({
      component: UserMenuComponent,
      event: ev,
      componentProps: { page: 'Login' },
      cssClass: 'popover_class',
    });

    return await popover.present();
  }
}

import { Component } from '@angular/core';
import { environment } from 'src/environments/environment';

import { PaDataService } from '../services/padata.service';
import { UiService } from '../services/ui.service';

import { PopoverController } from '@ionic/angular';
import { UserMenuComponent } from '../user-menu/user-menu.component';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss']
})
export class TabsPage {
  public useLocalStorage: boolean;

  public isLoggedIn = false;
  public userMenuShown = false;

  constructor(
    public popoverController: PopoverController,
    public paData: PaDataService,
    public uiService: UiService,
  ) {
    this.useLocalStorage = environment.localStorage;

    if (this.useLocalStorage) {
      return;
    }

    this.paData.authenticationState$.subscribe((authState) => {
      this.isLoggedIn = authState;
    });
    this.uiService.userMenuState$.subscribe((state) => {
      this.userMenuShown = state;
    });
  }

  async openUserMenu(ev: any) {
    const popover = await this.popoverController.create({
      component: UserMenuComponent,
      event: ev,
    });

    return await popover.present();
  }
}

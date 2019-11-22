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
  public isLoggedIn = false;

  public useLocalStorage: boolean;

  constructor(
    public popoverController: PopoverController,
    public paData: PaDataService,
  ) {
    this.useLocalStorage = environment.localStorage;

    this.paData.authenticationState$.subscribe((authState) => {
      this.isLoggedIn = authState;
    });
  }

  ngOnInit() {
  }

  async openUserMenu(ev: any) {
    const popover = await this.popoverController.create({
      component: UserMenuComponent,
      componentProps: {
        isLoggedIn: this.isLoggedIn,
      },
      event: ev,
    });

    return await popover.present();
  }
}

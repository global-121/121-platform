import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { PaDataService } from '../services/padata.service';
import { UserMenuComponent } from '../user-menu/user-menu.component';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
})
export class TabsPage {
  public isLoggedIn = false;

  constructor(
    private modalController: ModalController,
    private paData: PaDataService,
  ) {
    this.paData.authenticationState$.subscribe((user) => {
      this.isLoggedIn = !!user;
    });
  }

  async openUserMenu() {
    const popover = await this.modalController.create({
      component: UserMenuComponent,
      cssClass: 'user-menu-modal',
    });

    return await popover.present();
  }
}

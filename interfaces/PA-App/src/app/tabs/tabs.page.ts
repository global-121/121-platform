import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { MultipleRegistrationsMenuComponent } from '../multiple-registrations-menu/multiple-registrations-menu.component';
import { PaDataService } from '../services/padata.service';
import { UserMenuComponent } from '../user-menu/user-menu.component';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
})
export class TabsPage {
  public isLoggedIn = false;

  public multipleRegistrationMenuOpen = false;

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

  async openMultipleRegistrationsMenu() {
    this.multipleRegistrationMenuOpen = true;

    const popover = await this.modalController.create({
      component: MultipleRegistrationsMenuComponent,
      cssClass: 'multiple-registrations-menu-modal',
    });

    popover
      .onDidDismiss()
      .then(() => (this.multipleRegistrationMenuOpen = false));

    return await popover.present();
  }
}

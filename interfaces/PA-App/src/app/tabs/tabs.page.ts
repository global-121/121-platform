import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { environment } from 'src/environments/environment';
import { PaDataService } from '../services/padata.service';
import { UserMenuComponent } from '../user-menu/user-menu.component';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
})
export class TabsPage {
  public useLocalStorage: boolean;

  public isLoggedIn = false;

  constructor(
    private modalController: ModalController,
    public paData: PaDataService,
  ) {
    this.useLocalStorage = environment.localStorage;

    if (this.useLocalStorage) {
      return;
    }

    this.paData.authenticationState$.subscribe((authState) => {
      this.isLoggedIn = authState;
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

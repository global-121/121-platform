import { Component } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { PopoverComponent } from './popover/popover.component';
import { PaDataService } from '../services/padata.service';


@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss']
})
export class TabsPage {
  public accountBtnColor = 'medium';
  public isLoggedIn = false;
  events: any;

  constructor(
    public popoverController: PopoverController,
    public paData: PaDataService,
  ) {
    // Listen for completed sections, to continue with next steps
    this.paData.authenticationState$.subscribe((isLoggedIn: boolean) => {
      this.adjustAuthProperties(isLoggedIn);
    });
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

  async accountPopover(ev: any) {
    const popover = await this.popoverController.create({
      component: PopoverComponent,
      event: ev,
      componentProps: { page: 'Login' },
      cssClass: 'popover_class',
    });

    return await popover.present();
  }
}

import { Component, OnInit } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { PaDataService } from 'src/app/services/padata.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-user-menu',
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.scss']
})
export class UserMenuComponent implements OnInit {
  public isLoggedIn: boolean;
  page;

  constructor(
    private popoverController: PopoverController,
    private paData: PaDataService,
    public translate: TranslateService,
  ) {

  }

  ngOnInit() {
    this.paData.retrieve('isLoggedIn', true).then(value => {
      this.isLoggedIn = value;
    });
  }

  close() {
    this.popoverController.dismiss();
  }

  async logout() {
    this.paData.logout();
    this.paData.store('isLoggedIn', false, true);
    this.popoverController.dismiss();
    window.location.reload();
  }
}

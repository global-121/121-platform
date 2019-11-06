import { Component, OnInit } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { PaDataService } from 'src/app/services/padata.service';
import { TranslateService } from '@ngx-translate/core';
import { Storage } from '@ionic/storage';

@Component({
  selector: 'app-popover',
  templateUrl: './popover.component.html',
  styleUrls: ['./popover.component.scss']
})
export class PopoverComponent implements OnInit {
  public isLoggedIn: boolean;
  page;

  constructor(
    private popoverController: PopoverController,
    private paData: PaDataService,
    public translate: TranslateService,
    private ionStorage: Storage,
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
    await this.ionStorage.clear();
    window.location.reload();
  }

}

import { Component, OnInit, Input } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { PaDataService } from 'src/app/services/padata.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-user-menu',
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.scss']
})
export class UserMenuComponent implements OnInit {
  @Input()
  public data: any;

  public isLoggedIn = false;

  constructor(
    private popoverController: PopoverController,
    private paData: PaDataService,
    public translate: TranslateService,
  ) {
  }

  ngOnInit() {
    if (this.data) {
      this.isLoggedIn = this.data.isLoggedIn;
    }
  }

  close() {
    this.popoverController.dismiss();
  }

  async logout() {
    this.paData.logout();
    this.popoverController.dismiss();
    window.location.reload();
  }
}

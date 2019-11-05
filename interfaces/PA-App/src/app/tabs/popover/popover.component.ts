import { Component, OnInit } from '@angular/core';
import { PopoverController, ToastController } from '@ionic/angular';
import { PaDataService } from 'src/app/services/padata.service';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

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
    private toastController: ToastController,
    private router: Router,
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

  logout() {
    this.paData.logout();
    this.paData.store('isLoggedIn', false, true);
    this.popoverController.dismiss();
    this.createToast(this.translate.instant('account.logged-out'));
  }

  createToast(message: string) {
    this.toastController.create({
      header: message,
      animated: true,
      showCloseButton: true,
      closeButtonText: 'Close',
      cssClass: 'update-toast',
      duration: 3000,
      position: 'bottom',
      buttons: [
        {
          side: 'start',
          icon: 'share-alt',
          handler: () => {
            this.router.navigate(['tabs/personal']);
          }
        }]
    }).then((obj) => {
      obj.present();
    });
  }
}

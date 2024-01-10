import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-system-notification',
  templateUrl: 'system-notification.component.html',
  styleUrls: ['./system-notification.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class SystemNotificationComponent implements OnInit {
  @Input() public message: string;
  @Input() public color: string;
  @Input() public delay = 0;

  private toast: HTMLIonToastElement;

  constructor(public toastController: ToastController) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.presentToast();
    }, this.delay);
  }

  async presentToast() {
    this.toast = await this.toastController.create({
      message: this.message,
      cssClass: 'system-notification ion-text-center',
      position: 'top',
      color: this.color,
      buttons: [
        {
          side: 'end',
          icon: 'close',
          role: 'cancel',
        },
      ],
    });
    await this.toast.present();
  }

  public closeToast() {
    this.toast.dismiss();
  }
}

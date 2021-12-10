import { Component, Input, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-system-notification',
  templateUrl: 'system-notification.component.html',
  styleUrls: ['./system-notification.component.scss'],
})
export class SystemNotificationComponent implements OnInit {
  @Input() public message: string;
  @Input() public color: string;

  constructor(public toastController: ToastController) {}

  ngOnInit(): void {
    this.presentToast();
  }

  async presentToast() {
    const toast = await this.toastController.create({
      message: this.message,
      cssClass: 'login-notification ion-text-center',
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
    await toast.present();
  }
}

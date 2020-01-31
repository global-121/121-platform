import { Component, OnInit, Input } from '@angular/core';
import { InfoPopupComponent } from '../../info-popup/info-popup.component';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'more-info-button',
  templateUrl: './more-info-button.component.html',
  styleUrls: ['./more-info-button.component.scss'],
})
export class MoreInfoButtonComponent implements OnInit {
  @Input()
  heading: string;

  @Input()
  message: string;

  constructor(
    private modalController: ModalController,
  ) { }

  ngOnInit() { }

  public async openInfoPopup() {
    const infoPopup = await this.modalController.create({
      component: InfoPopupComponent,
      componentProps: {
        heading: this.heading,
        message: this.message,
      },
      cssClass: 'more-info-popup',
    });

    return await infoPopup.present();
  }

}

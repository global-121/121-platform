import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { InfoPopupComponent } from '../info-popup/info-popup.component';

@Component({
  selector: 'more-info-button',
  templateUrl: './more-info-button.component.html',
  styleUrls: ['./more-info-button.component.scss'],
})
export class MoreInfoButtonComponent implements OnInit {
  @Input()
  buttonKey: string;

  @Input()
  heading: string;

  @Input()
  headingKey: string;

  @Input()
  message: string;

  @Input()
  messageKey: string;

  constructor(private modalController: ModalController) {}

  ngOnInit() {}

  public async openInfoPopup() {
    const infoPopup = await this.modalController.create({
      component: InfoPopupComponent,
      componentProps: {
        heading: this.heading,
        headingKey: this.headingKey,
        message: this.message,
        messageKey: this.messageKey,
      },
      cssClass: 'more-info-popup',
    });

    return await infoPopup.present();
  }
}

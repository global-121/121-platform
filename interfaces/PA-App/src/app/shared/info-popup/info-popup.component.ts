import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-info-popup',
  templateUrl: './info-popup.component.html',
  styleUrls: ['./info-popup.component.scss'],
})
export class InfoPopupComponent {
  @Input()
  public heading: string;

  @Input()
  public headingKey: string;

  @Input()
  public message: string;

  @Input()
  public messageKey: string;

  constructor(private modalController: ModalController) {}

  close() {
    this.modalController.dismiss();
  }
}

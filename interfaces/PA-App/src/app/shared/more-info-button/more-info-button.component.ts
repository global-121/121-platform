import { Component, OnInit, Input } from '@angular/core';
import { InfoPopupComponent } from '../../info-popup/info-popup.component';
import { PopoverController } from '@ionic/angular';

@Component({
  selector: 'more-info-button',
  templateUrl: './more-info-button.component.html',
  styleUrls: ['./more-info-button.component.scss'],
})
export class MoreInfoButtonComponent implements OnInit {
  @Input()
  message: string;

  constructor(
    private popoverController: PopoverController,
  ) { }

  ngOnInit() { }

  public async openInfoPopup() {
    const popover = await this.popoverController.create({
      component: InfoPopupComponent,
      componentProps: {
        message: this.message
      }
    });

    return await popover.present();
  }

}

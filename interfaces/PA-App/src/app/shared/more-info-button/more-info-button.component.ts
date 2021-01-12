import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import {
  LoggingEvent,
  LoggingEventCategory,
} from 'src/app/models/logging-event.enum';
import { LoggingService } from 'src/app/services/logging.service';
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

  constructor(
    private modalController: ModalController,
    private logger: LoggingService,
  ) {}

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

    this.logger.logEvent(LoggingEventCategory.ui, LoggingEvent.popUpOpen, {
      name: this.buttonKey,
    });

    return await infoPopup.present();
  }
}

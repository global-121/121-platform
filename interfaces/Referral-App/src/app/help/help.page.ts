import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import helpMock from 'src/app/mocks/help.mock';
import { AnalyticsEventName } from 'src/app/models/event-name.model';
import { Help } from 'src/app/models/help.model';
import { HelpService } from 'src/app/services/help.service';
import { LoggingService } from 'src/app/services/logging.service';

@Component({
  selector: 'app-help',
  templateUrl: './help.page.html',
  styleUrls: ['./help.page.scss'],
})
export class HelpPage {
  public help: Help = helpMock;

  constructor(
    public modalController: ModalController,
    public helpService: HelpService,
    private loggingService: LoggingService,
  ) {
    this.loadHelpDetails();
  }

  loadHelpDetails() {
    this.helpService.getHelp().then((help) => {
      this.help = help;
    });
  }

  dismiss() {
    this.loggingService.logEvent(AnalyticsEventName.ReferralHelpPageClose);
    this.modalController.dismiss({
      dismissed: true,
    });
  }

  public logClick(name) {
    this.loggingService.logEvent(AnalyticsEventName.ReferralHelpClick, {
      name,
    });
  }
}

import { Component, Input } from '@angular/core';
import { AnalyticsEventName } from 'src/app/models/event-name.model';
import { Offer } from 'src/app/models/offer.model';
import { LoggingService } from 'src/app/services/logging.service';

@Component({
  selector: 'offer',
  templateUrl: './offer.component.html',
  styleUrls: ['./offer.component.scss'],
})
export class OfferComponent {
  @Input()
  offer: Offer;

  @Input()
  showDetails = false;

  @Input()
  goBack;

  constructor(private loggingService: LoggingService) {}

  public logClick(name) {
    this.loggingService.logEvent(AnalyticsEventName.ReferralOfferClick, {
      name,
      offerName: this.offer.offerName,
    });
  }
}

import { Component, Input } from '@angular/core';
import { LoggingEvent } from 'src/app/models/logging-event.enum';
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
    this.loggingService.logEvent(LoggingEvent.ReferralOfferClick, {
      name,
      offerName: this.offer.offerName,
    });
  }
}

import { Component, Input } from '@angular/core';
import { Offer } from 'src/app/models/offer.model';

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

  constructor() {}
}

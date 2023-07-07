import { Component, Input } from '@angular/core';
import {
  PaymentRowDetail,
  PayoutDetails,
  SinglePayoutDetails,
} from 'src/app/models/payment.model';

@Component({
  selector: 'app-payment-history-accordeon',
  templateUrl: './payment-history-accordeon.component.html',
  styleUrls: ['./payment-history-accordeon.component.scss'],
})
export class PaymentHistoryAccordeonComponent {
  @Input()
  public paymentRow: PaymentRowDetail[] = [];
  @Input()
  public payout: PayoutDetails[] = [];
  @Input()
  public singlePayout: SinglePayoutDetails[] = [];
}

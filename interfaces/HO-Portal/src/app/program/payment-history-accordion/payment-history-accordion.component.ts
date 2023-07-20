import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DateFormat } from 'src/app/enums/date-format.enum';

@Component({
  selector: 'app-payment-history-accordion',
  templateUrl: './payment-history-accordion.component.html',
  styleUrls: ['./payment-history-accordion.component.scss'],
})
export class PaymentHistoryAccordionComponent {
  DateFormat = DateFormat;

  @Input()
  public paymentRow: any;

  @Input()
  public hasVoucherSupport: any;

  @Input()
  public hasError: any;

  @Input()
  public hasWaiting: any;

  @Output()
  enableSinglePayment = new EventEmitter<any>();

  @Output()
  rowClick = new EventEmitter<any>();
}

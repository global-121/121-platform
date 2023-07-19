import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DateFormat } from 'src/app/enums/date-format.enum';

@Component({
  selector: 'app-payment-history-accordeon',
  templateUrl: './payment-history-accordeon.component.html',
  styleUrls: ['./payment-history-accordeon.component.scss'],
})
export class PaymentHistoryAccordeonComponent {
  DateFormat = DateFormat;

  @Input()
  public paymentRow: any;

  @Input()
  public hasVoucherSupport: any;

  @Output()
  enableSinglePayment = new EventEmitter<any>();

  @Output()
  rowClick = new EventEmitter<any>();

  @Input()
  public hasError: any;

  @Input()
  public hasWaiting: any;
}

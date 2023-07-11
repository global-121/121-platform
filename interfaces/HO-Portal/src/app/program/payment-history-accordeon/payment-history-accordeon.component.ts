import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-payment-history-accordeon',
  templateUrl: './payment-history-accordeon.component.html',
  styleUrls: ['./payment-history-accordeon.component.scss'],
})
export class PaymentHistoryAccordeonComponent {
  @Input()
  public paymentRowData: any;

  @Input()
  public voucherSupportData: any;

  @Input()
  public enableSinglePaymentData: any;

  @Input()
  public hasErrorData: any;

  @Input()
  public hasWaitingData: any;

  @Input()
  public displayTransactionDateOnlyData: any;

  @Input()
  public displayTransactionDateTimeData: any;
}

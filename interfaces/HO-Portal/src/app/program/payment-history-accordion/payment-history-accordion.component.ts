import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { DateFormat } from 'src/app/enums/date-format.enum';
import { PaymentUtils } from 'src/app/shared/payment.utils';
@Component({
  selector: 'app-payment-history-accordion',
  templateUrl: './payment-history-accordion.component.html',
  styleUrls: ['./payment-history-accordion.component.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule, TranslateModule],
})
export class PaymentHistoryAccordionComponent {
  DateFormat = DateFormat;
  hasErrorCheck = PaymentUtils.hasError;
  hasWaitingCheck = PaymentUtils.hasError;
  hasVoucherSupportCheck = PaymentUtils.hasVoucherSupport;
  getCustomDataAttributesCheck = PaymentUtils.getCustomDataAttributesToShow;

  @Input()
  public paymentRow: any;

  @Input()
  public enableSinglePayment: any;

  @Output()
  rowClick = new EventEmitter<any>();
}

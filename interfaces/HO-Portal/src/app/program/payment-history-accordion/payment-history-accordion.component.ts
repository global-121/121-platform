import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { DateFormat } from 'src/app/enums/date-format.enum';
import { SharedModule } from 'src/app/shared/shared.module';

@Component({
  selector: 'app-payment-history-accordion',
  templateUrl: './payment-history-accordion.component.html',
  styleUrls: ['./payment-history-accordion.component.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule, SharedModule, CommonModule],
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

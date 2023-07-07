import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { PaymentHistoryContentComponent } from '../payment-history-content/payment-history-content.component';
@Component({
  selector: 'app-payment-history-popup',
  templateUrl: './payment-history-popup.component.html',
  styleUrls: ['./payment-history-popup.component.scss'],
})
export class PaymentHistoryPopupComponent {
  @Input()
  public paymentHistoryContent: PaymentHistoryContentComponent;
  public paDisplayName: string;

  constructor(private modalController: ModalController) {}

  public closeModal() {
    this.modalController.dismiss();
  }
}

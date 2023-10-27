import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { SubmitPaymentProps } from '../../shared/confirm-prompt/confirm-prompt.component';

@Component({
  selector: 'app-submit-payment-popup',
  templateUrl: './submit-payment-popup.component.html',
  styleUrls: ['./submit-payment-popup.component.scss'],
})
export class SubmitPaymentPopupComponent {
  @Input()
  public submitPaymentProps: SubmitPaymentProps;

  constructor(private modalController: ModalController) {}

  public closeModal() {
    this.modalController.dismiss(null, 'cancel');
  }
}

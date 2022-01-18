import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { SubmitPaymentProps } from '../../shared/confirm-prompt/confirm-prompt.component';

@Component({
  selector: 'app-submit-payment-popup',
  templateUrl: './submit-payment-popup.component.html',
  styleUrls: ['./submit-payment-popup.component.scss'],
})
export class SubmitPaymentPopupComponent implements OnInit {
  @Input()
  public submitPaymentProps: SubmitPaymentProps;

  public nextPaymentId: number;

  constructor(private modalController: ModalController) {}

  async ngOnInit() {}

  public closeModal() {
    this.modalController.dismiss();
  }
}

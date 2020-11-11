import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-payment-status-popup',
  templateUrl: './payment-status-popup.component.html',
  styleUrls: ['./payment-status-popup.component.scss'],
})
export class PaymentStatusPopupComponent implements OnInit {
  public error: string;
  public column: string;
  public voucher: any;

  constructor(private modalController: ModalController) {}

  ngOnInit() {}

  public closeModal() {
    this.modalController.dismiss();
  }
}

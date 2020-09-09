import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-payment-error-popup',
  templateUrl: './payment-error-popup.component.html',
  styleUrls: ['./payment-error-popup.component.scss'],
})
export class PaymentErrorPopupComponent implements OnInit {
  public error: string;
  public column: string;
  
  constructor(private modalController: ModalController) {}

  ngOnInit() {}

  public closeModal() {
    this.modalController.dismiss();
  }
}

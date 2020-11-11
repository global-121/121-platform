import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-payment-status-popup',
  templateUrl: './payment-status-popup.component.html',
  styleUrls: ['./payment-status-popup.component.scss'],
})
export class PaymentStatusPopupComponent implements OnInit {
  public title: string;
  public content: any;
  public imageUrl: string;

  constructor(
    private modalController: ModalController,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit() {
    if (this.imageUrl) {
      this.imageUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
        this.imageUrl,
      ) as string;
    }
  }

  public closeModal() {
    this.modalController.dismiss();
  }
}

import { Component, OnInit, Input } from '@angular/core';
import { PopoverController } from '@ionic/angular';

@Component({
  selector: 'app-info-popup',
  templateUrl: './info-popup.component.html',
  styleUrls: ['./info-popup.component.scss'],
})
export class InfoPopupComponent implements OnInit {
  @Input()
  public data: any;

  public message: string;

  constructor(
    private popoverController: PopoverController,
  ) {
  }

  ngOnInit() {
    if (this.data) {
      this.message = this.data.message;
    }
  }

  close() {
    this.popoverController.dismiss();
  }

}

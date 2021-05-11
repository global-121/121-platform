import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-edit-person-affected-popup',
  templateUrl: './edit-person-affected-popup.component.html',
  styleUrls: ['./edit-person-affected-popup.component.scss'],
})
export class EditPersonAffectedPopupComponent implements OnInit {
  public title: string;
  public content: any;
  public contentNotes: any;

  public isInProgress = false;

  constructor(private modalController: ModalController) {}

  async ngOnInit() {}

  public closeModal() {
    this.modalController.dismiss();
  }
}

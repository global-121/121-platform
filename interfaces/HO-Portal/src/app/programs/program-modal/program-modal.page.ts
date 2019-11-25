import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Program } from 'src/app/models/program.model';

@Component({
  selector: 'app-program-modal',
  templateUrl: './program-modal.page.html',
  styleUrls: ['./program-modal.page.scss'],
})
export class ProgramModalPage {
  program: Program;

  constructor(
    private modalController: ModalController
  ) { }

  ionViewWillEnter() {
  }

  async myDismiss() {
    const result: Date = new Date();

    await this.modalController.dismiss(result);
  }

}

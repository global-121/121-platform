import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ProgramTeamPopupComponent } from './program-team-popup/program-team-popup.component';

@Component({
  selector: 'app-program-team',
  templateUrl: './program-team.component.html',
  styleUrls: ['./program-team.component.scss'],
})
export class ProgramTeamPage {
  constructor(public modalController: ModalController) {}

  public async programTeamPopup(e: Event) {
    event = e;
    const modal: HTMLIonModalElement = await this.modalController.create({
      component: ProgramTeamPopupComponent,
    });
    await modal.present();
  }
}

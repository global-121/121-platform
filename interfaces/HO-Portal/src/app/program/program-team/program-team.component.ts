import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { ProgramTeamPopupComponent } from './program-team-popup/program-team-popup.component';

@Component({
  selector: 'app-program-team',
  templateUrl: './program-team.component.html',
  styleUrls: ['./program-team.component.scss'],
})
export class ProgramTeamPage {
  public programId: number;

  constructor(
    public modalController: ModalController,
    private route: ActivatedRoute,
  ) {
    this.programId = this.route.snapshot.params.id;
  }

  public async programTeamPopup(e: Event) {
    event = e;
    const modal: HTMLIonModalElement = await this.modalController.create({
      component: ProgramTeamPopupComponent,
      componentProps: { programId: this.programId },
    });
    await modal.present();
  }
}

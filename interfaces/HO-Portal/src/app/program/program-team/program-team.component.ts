import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { ProgramTeamPopupComponent } from './program-team-popup/program-team-popup.component';
import { ProgramTeamTableComponent } from './program-team-table/program-team-table.component';

@Component({
  selector: 'app-program-team',
  templateUrl: './program-team.component.html',
  styleUrls: ['./program-team.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    ProgramTeamTableComponent,
    TranslateModule,
  ],
})
export class ProgramTeamPage {
  public programId: number;

  constructor(
    public modalController: ModalController,
    private route: ActivatedRoute,
  ) {
    this.programId = this.route.snapshot.params.id;
  }

  public async programTeamPopup(): Promise<void> {
    const modal: HTMLIonModalElement = await this.modalController.create({
      component: ProgramTeamPopupComponent,
      componentProps: { programId: this.programId },
    });
    await modal.present();
  }
}

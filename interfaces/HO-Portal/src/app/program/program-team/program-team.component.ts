import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ProgramTeamPopupOperationEnum } from '../../models/program-team-popup-operation.enum';
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
export class ProgramTeamComponent {
  public programId: number;

  constructor(
    public modalController: ModalController,
    private route: ActivatedRoute,
    private translate: TranslateService,
  ) {
    this.programId = this.route.snapshot.params.id;
  }

  public async programTeamPopup(): Promise<void> {
    const modal: HTMLIonModalElement = await this.modalController.create({
      component: ProgramTeamPopupComponent,
      componentProps: {
        operation: ProgramTeamPopupOperationEnum.add,
        programId: Number(this.programId), // Not sure why this.route.snapshot.params.id is used in a lot of places but it's not a number
        title: this.translate.instant('page.program-team.popup.add.title'),
      },
    });
    await modal.present();
  }
}

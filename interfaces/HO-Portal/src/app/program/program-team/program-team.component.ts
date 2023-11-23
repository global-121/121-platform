import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from 'src/app/auth/auth.service';
import Permission from 'src/app/auth/permission.enum';
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
export class ProgramTeamComponent implements OnInit {
  public programId: number;
  public canManageAidworkers: boolean;

  constructor(
    public modalController: ModalController,
    private route: ActivatedRoute,
    private translate: TranslateService,
    private authService: AuthService,
  ) {
    this.programId = this.route.snapshot.params.id;
  }

  public async ngOnInit() {
    this.canManageAidworkers = this.authService.hasPermission(
      this.programId,
      Permission.AidWorkerProgramUPDATE,
    );
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

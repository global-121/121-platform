import { Component, OnInit, Input } from '@angular/core';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { TranslateService } from '@ngx-translate/core';
import { AlertController } from '@ionic/angular';
import { UserRole } from 'src/app/auth/user-role.enum';
import { ProgramPhaseService } from 'src/app/services/program-phase.service';
import { ProgramPhase } from 'src/app/models/program.model';

@Component({
  selector: 'app-export-inclusion',
  templateUrl: './export-inclusion.component.html',
  styleUrls: ['./export-inclusion.component.scss'],
})
export class ExportInclusionComponent implements OnInit {
  @Input()
  public programId: number;

  @Input()
  public userRole: UserRole;

  constructor(
    private programPhaseService: ProgramPhaseService,
    private programsService: ProgramsServiceApiService,
    private translate: TranslateService,
    private alertController: AlertController,
  ) {}

  ngOnInit() {}

  public btnDisabled() {
    const activePhase = this.programPhaseService.getActivePhase();

    return (
      activePhase.name !== ProgramPhase.reviewInclusion &&
      this.userRole !== UserRole.ProgramManager
    );
  }

  public getInclusionList() {
    this.programsService.exportInclusionList(this.programId).then(
      (res) => {
        const blob = new Blob([res.data], { type: 'text/csv' });
        saveAs(blob, res.fileName);
      },
      (err) => {
        console.log('err: ', err);
        this.actionResult(this.translate.instant('common.export-error'));
      },
    );
  }

  private async actionResult(resultMessage: string) {
    const alert = await this.alertController.create({
      message: resultMessage,
      buttons: [this.translate.instant('common.ok')],
    });

    await alert.present();
  }
}

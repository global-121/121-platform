import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { UserRole } from 'src/app/auth/user-role.enum';
import { ProgramPhase } from 'src/app/models/program.model';
import { ProgramPhaseService } from 'src/app/services/program-phase.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';

@Component({
  selector: 'app-export-inclusion',
  templateUrl: './export-inclusion.component.html',
  styleUrls: ['./export-inclusion.component.scss'],
})
export class ExportInclusionComponent implements OnChanges {
  @Input()
  public programId: number;

  @Input()
  public userRole: UserRole;

  public disabled: boolean;

  constructor(
    private programPhaseService: ProgramPhaseService,
    private programsService: ProgramsServiceApiService,
    private translate: TranslateService,
    private alertController: AlertController,
  ) {}

  async ngOnChanges(changes: SimpleChanges) {
    if (
      changes.programId &&
      ['string', 'number'].includes(typeof changes.programId.currentValue)
    ) {
      await this.programPhaseService.getPhases(this.programId);
      this.disabled = this.btnDisabled();
    }
  }

  public btnDisabled() {
    const activePhase = this.programPhaseService.getActivePhase();

    return (
      activePhase.name !== ProgramPhase.reviewInclusion ||
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

import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { UserRole } from 'src/app/auth/user-role.enum';
import { ProgramPhase } from 'src/app/models/program.model';
import { ProgramPhaseService } from 'src/app/services/program-phase.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { ExportType } from 'src/app/models/export-type.model';

@Component({
  selector: 'app-export-list',
  templateUrl: './export-list.component.html',
  styleUrls: ['./export-list.component.scss'],
})
export class ExportListComponent implements OnChanges {
  @Input()
  public programId: number;
  @Input()
  public userRole: UserRole;
  @Input()
  public exportType: ExportType;
  @Input()
  public paymentInstallment: number;
  @Input()
  public paymentExportAvailable: boolean;

  public disabled: boolean;

  public btnText: string;
  public subHeader: string;

  constructor(
    private programPhaseService: ProgramPhaseService,
    private programsService: ProgramsServiceApiService,
    private translate: TranslateService,
    private alertController: AlertController,
  ) {}

  ngOnInit() {
    this.btnText = this.translate.instant(
      'page.program.export-list.' + this.exportType + '.btn-text',
    );
    this.subHeader = this.translate.instant(
      'page.program.export-list.' + this.exportType + '.confirm-message',
    );
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (
      changes.programId &&
      ['string', 'number'].includes(typeof changes.programId.currentValue)
    ) {
      await this.programPhaseService.getPhases(this.programId);
      this.disabled = !this.btnEnabled();
    }
  }

  public btnEnabled() {
    const activePhase = this.programPhaseService.getActivePhase();

    return (
      ((activePhase.name === ProgramPhase.reviewInclusion &&
        this.exportType === ExportType.included) ||
        (activePhase.name === ProgramPhase.registrationValidation &&
          this.exportType === ExportType.selectedForValidation) ||
        (activePhase.name === ProgramPhase.payment &&
          this.exportType === ExportType.payment &&
          this.paymentExportAvailable)) &&
      this.userRole === UserRole.ProgramManager
    );
  }

  public getExportList() {
    this.programsService
      .exportList(+this.programId, this.exportType, +this.paymentInstallment)
      .then(
        (res) => {
          if (!res.data) {
            this.actionResult(
              this.translate.instant('page.program.export-list.no-data'),
            );
            return;
          }
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

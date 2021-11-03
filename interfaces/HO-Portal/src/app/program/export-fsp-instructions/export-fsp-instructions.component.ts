import { Component, Input, OnChanges } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'src/app/auth/auth.service';
import { UserRole } from 'src/app/auth/user-role.enum';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { arrayToCsv } from '../../shared/array-to-csv';

@Component({
  selector: 'app-export-fsp-instructions',
  templateUrl: './export-fsp-instructions.component.html',
  styleUrls: ['./export-fsp-instructions.component.scss'],
})
export class ExportFspInstructionsComponent implements OnChanges {
  @Input()
  public programId: number;
  // @Input()
  public disabled: boolean;
  @Input()
  public payment: number;
  public isInProgress = false;

  public btnText: string;
  public subHeader: string;
  public message: string;

  constructor(
    private authService: AuthService,
    private programsService: ProgramsServiceApiService,
    private translate: TranslateService,
    private alertController: AlertController,
  ) { }

  ngOnInit() {
    this.btnText = this.translate.instant(
      'page.program.export-fsp-intructions.btn-text',
    );
    this.updateSubHeader();
  }

  async ngOnChanges() {
    this.disabled = !this.btnEnabled();
  }

  private async updateSubHeader() {
    this.subHeader = this.translate.instant(
      'page.program.export-fsp-intructions.confirm-message',
    );
    this.message = this.translate.instant('page.program.export-fsp-intructions.sub-message')
  }

  private btnEnabled() {
    return (
      this.authService.hasUserRole([UserRole.PersonalData]) && this.payment > 0
    );
  }

  public async getExportFspInstructions() {
    this.isInProgress = true;
    this.programsService
      .exportFspInstructions(
        Number(this.programId),
        this.payment
      )
      .then(
        (res) => {
          this.isInProgress = false;
          console.log('res: ', res);
          arrayToCsv(res.data, 'test.csv')
          if (!res.data) {
            this.actionResult(
              this.translate.instant('page.program.export-list.no-data'),
            );
            return;
          }
          this.updateSubHeader();
        },
        (err) => {
          this.isInProgress = false;
          console.log('err: ', err);
          this.actionResult(this.translate.instant('common.export-error'));
        },
      );
  }

  private async actionResult(resultMessage: string) {
    const alert = await this.alertController.create({
      backdropDismiss: false,
      message: resultMessage,
      buttons: [this.translate.instant('common.ok')],
    });
    await alert.present();
  }
}

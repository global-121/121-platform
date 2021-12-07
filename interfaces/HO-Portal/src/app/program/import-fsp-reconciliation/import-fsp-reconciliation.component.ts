import { Component, Input, OnChanges } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'src/app/auth/auth.service';
import { UserRole } from 'src/app/auth/user-role.enum';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { ImportType } from '../../models/import-type.enum';
import { FilePickerProps } from '../../shared/file-picker-prompt/file-picker-prompt.component';

@Component({
  selector: 'app-import-fsp-reconciliation',
  templateUrl: './import-fsp-reconciliation.component.html',
  styleUrls: ['./import-fsp-reconciliation.component.scss'],
})
export class ImportFspReconciliationComponent implements OnChanges {
  @Input()
  public programId: number;

  @Input()
  public lastPaymentId: number;

  public disabled: boolean;
  public isInProgress = false;

  public btnText: string;
  public subHeader: string;
  public message: string;
  public filePickerProps: FilePickerProps;

  constructor(
    private authService: AuthService,
    private programsService: ProgramsServiceApiService,
    private translate: TranslateService,
    private alertController: AlertController,
  ) {}

  ngOnInit() {
    this.btnText = this.translate.instant(
      'page.program.import-fsp-reconciliation.btn-text',
    );
    this.updateSubHeader();
    this.filePickerProps = {
      type: 'csv',
      explanation: this.translate.instant(
        'page.program.import-fsp-reconciliation.explanation',
      ),
      programId: this.programId,
      downloadTemplate: ImportType.imported,
    };
  }

  async ngOnChanges() {
    this.disabled = !this.btnEnabled();
  }

  private async updateSubHeader() {
    this.subHeader = this.translate.instant(
      'page.program.import-fsp-reconciliation.confirm-message',
    );
  }

  private btnEnabled() {
    return (
      this.authService.hasUserRole([UserRole.PersonalData]) &&
      this.lastPaymentId > 0
    );
  }

  public async importFspReconciliation(event: { file: File }) {
    this.isInProgress = true;

    this.programsService
      .importFspReconciliation(this.programId, event.file)
      .then(
        (response) => {
          const aggregateResult = response.aggregateImportResult;
          this.isInProgress = false;
          let resultMessage =
            this.translate.instant(
              'page.program.import-fsp-reconciliation.import-result.ready',
            ) + '<br><br>';

          resultMessage +=
            this.translate.instant(
              'page.program.import-fsp-reconciliation.import-result.new',
              {
                countImported: `<strong>${aggregateResult.countImported}</strong>`,
              },
            ) + '<br><br>';

          if (aggregateResult.countNotFound) {
            resultMessage +=
              this.translate.instant(
                'page.program.import-fsp-reconciliation.import-result.not-found',
                {
                  countNotFound: `<strong>${aggregateResult.countNotFound}</strong>`,
                },
              ) + '<br><br>';
          }

          this.actionResult(resultMessage);
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

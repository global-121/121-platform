import { Component, Input, OnChanges } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { downloadAsCsv } from '../../shared/array-to-csv';
import { arrayToXlsx as downloadAsXlsx } from '../../shared/array-to-xlsx';
import { downloadAsXml } from '../../shared/string-to-xml';
import { ExportFileType } from './../../../../../../services/121-service/src/payments/dto/fsp-instructions.dto';

@Component({
  selector: 'app-export-fsp-instructions',
  templateUrl: './export-fsp-instructions.component.html',
  styleUrls: ['./export-fsp-instructions.component.scss'],
})
export class ExportFspInstructionsComponent implements OnChanges {
  @Input()
  public programId: number;

  @Input()
  public payment: number;

  @Input()
  public lastPaymentId: number;

  public disabled: boolean;
  public isInProgress = false;

  public btnText: string;
  public subHeader: string;
  public message: string;

  constructor(
    private programsService: ProgramsServiceApiService,
    private translate: TranslateService,
    private alertController: AlertController,
  ) {}

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
    this.message = this.translate.instant(
      'page.program.export-fsp-intructions.sub-message',
    );
  }

  private btnEnabled() {
    return this.payment > 0 && this.payment <= this.lastPaymentId;
  }

  public async getExportFspInstructions() {
    this.isInProgress = true;
    this.programsService
      .exportFspInstructions(Number(this.programId), this.payment)
      .then(
        (res) => {
          this.isInProgress = false;
          if (res.length < 1) {
            this.actionResult(
              this.translate.instant('page.program.export-list.no-data'),
            );
            return;
          }
          const exportFileName = `payment#${this.payment}-fsp-instructions`;

          if (res.fileType === ExportFileType.csv) {
            downloadAsCsv(res.data, exportFileName);
          }
          if (res.fileType === ExportFileType.excel) {
            downloadAsXlsx(res.data, exportFileName);
          }
          if (res.fileType === ExportFileType.xml) {
            downloadAsXml(res.data, exportFileName);
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

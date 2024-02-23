import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { AuthService } from '../../auth/auth.service';
import Permission from '../../auth/permission.enum';
import { ActionType } from '../../models/actions.model';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { LatestActionService } from '../../services/latest-action.service';
import { actionResult } from '../../shared/action-result';
import { downloadAsCsv } from '../../shared/array-to-csv';
import { arrayToXlsx as downloadAsXlsx } from '../../shared/array-to-xlsx';
import { downloadAsXml } from '../../shared/string-to-xml';
import { ExportFileType } from './../../../../../../services/121-service/src/payments/dto/fsp-instructions.dto';

@Component({
  selector: 'app-export-fsp-instructions',
  templateUrl: './export-fsp-instructions.component.html',
  styleUrls: ['./export-fsp-instructions.component.scss'],
})
export class ExportFspInstructionsComponent implements OnChanges, OnInit {
  @Input()
  public programId: number;

  @Input()
  public payment: number;

  @Input()
  public lastPaymentId: number;

  @Input()
  private hasFspWithReconciliation: boolean;

  @Input()
  public paymentInProgress: boolean;

  public disabled: boolean;
  public isInProgress = false;

  public btnText: string;
  public subHeader: string;
  public message: string;

  constructor(
    private programsService: ProgramsServiceApiService,
    private translate: TranslateService,
    private alertController: AlertController,
    private authService: AuthService,
    private latestActionService: LatestActionService,
    private errorHandlerService: ErrorHandlerService,
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
    // This shows the 'reconciliation' variant if there is at least one FSP with reconciliation (not 100% correct, but good enough for now)
    this.message = this.translate.instant(
      this.hasFspWithReconciliation
        ? 'page.program.export-fsp-intructions.sub-message.reconciliation'
        : 'page.program.export-fsp-intructions.sub-message.no-reconciliation',
    );
    if (this.authService.hasPermission(this.programId, Permission.ActionREAD)) {
      const actionTimestamp =
        await this.latestActionService.getLatestActionTime(
          ActionType.exportFspInstructions,
          this.programId,
        );
      this.message += actionTimestamp
        ? '<br><br>' +
          this.translate.instant(
            'page.program.export-fsp-intructions.timestamp',
            {
              dateTime: actionTimestamp,
            },
          )
        : '';
    }
  }

  private btnEnabled() {
    return (
      this.payment > 0 &&
      this.payment <= this.lastPaymentId &&
      // only disable last payment if in progress
      (!this.paymentInProgress || this.payment < this.lastPaymentId)
    );
  }

  public async getExportFspInstructions() {
    this.isInProgress = true;
    this.programsService
      .exportFspInstructions(Number(this.programId), this.payment)
      .then(
        (res) => {
          this.isInProgress = false;
          if (!res.data || res.data.length === 0) {
            actionResult(
              this.alertController,
              this.translate,
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
          actionResult(
            this.alertController,
            this.translate,
            this.translate.instant('common.error-with-message', {
              error: this.errorHandlerService.formatErrors(err),
            }),
          );
        },
      );
  }
}

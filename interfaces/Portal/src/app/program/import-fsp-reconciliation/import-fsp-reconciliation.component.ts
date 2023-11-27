import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../app/auth/auth.service';
import { ProgramsServiceApiService } from '../../../app/services/programs-service-api.service';
import Permission from '../../auth/permission.enum';
import { ActionType } from '../../models/actions.model';
import { LatestActionService } from '../../services/latest-action.service';
import { actionResult } from '../../shared/action-result';
import { FilePickerProps } from '../../shared/file-picker-prompt/file-picker-prompt.component';

@Component({
  selector: 'app-import-fsp-reconciliation',
  templateUrl: './import-fsp-reconciliation.component.html',
  styleUrls: ['./import-fsp-reconciliation.component.scss'],
})
export class ImportFspReconciliationComponent implements OnChanges, OnInit {
  @Input()
  public programId: number;

  @Input()
  public payment: number;

  @Input()
  public fspIds: number[];

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
    private latestActionService: LatestActionService,
  ) {}

  ngOnInit() {
    this.btnText = this.translate.instant(
      'page.program.import-fsp-reconciliation.btn-text',
    );
    this.updateSubHeader();
    this.filePickerProps = {
      type: 'xml',
      explanation: this.translate.instant(
        'page.program.import-fsp-reconciliation.explanation',
      ),
      programId: this.programId,
      downloadTemplate: null,
    };
  }

  async ngOnChanges() {
    this.disabled = !this.btnEnabled();
  }

  private async updateSubHeader() {
    this.subHeader = this.translate.instant(
      'page.program.import-fsp-reconciliation.confirm-message',
    );
    if (this.authService.hasPermission(this.programId, Permission.ActionREAD)) {
      const actionTimestamp =
        await this.latestActionService.getLatestActionTime(
          ActionType.importFspReconciliation,
          this.programId,
        );
      this.message = actionTimestamp
        ? this.translate.instant(
            'page.program.import-fsp-reconciliation.timestamp',
            {
              dateTime: actionTimestamp,
            },
          )
        : '';
    }
  }

  private btnEnabled() {
    return (
      this.authService.hasAllPermissions(this.programId, [
        Permission.PaymentREAD,
        Permission.PaymentCREATE,
        Permission.PaymentTransactionREAD,
      ]) &&
      this.payment > 0 &&
      this.payment <= this.lastPaymentId
    );
  }

  public async importFspReconciliation(event: { file: File }) {
    this.isInProgress = true;

    this.programsService
      .importFspReconciliation(
        this.programId,
        this.payment,
        this.fspIds,
        event.file,
      )
      .then(
        (response) => {
          const aggregateResult = response.aggregateImportResult;
          this.isInProgress = false;
          let resultMessage =
            this.translate.instant(
              'page.program.import-fsp-reconciliation.import-result.ready',
              {
                payment: this.payment,
              },
            ) + '<br><br>';

          resultMessage +=
            this.translate.instant(
              'page.program.import-fsp-reconciliation.import-result.new',
              {
                countTotal:
                  aggregateResult.countPaymentSuccess +
                  aggregateResult.countPaymentFailed,
                countPaymentSuccess: aggregateResult.countPaymentSuccess,
                countPaymentFailed: aggregateResult.countPaymentFailed,
              },
            ) + '<br><br>';

          if (
            aggregateResult.countPaymentStarted !==
            aggregateResult.countImported
          ) {
            resultMessage +=
              this.translate.instant(
                'page.program.import-fsp-reconciliation.import-result.mismatch',
                {
                  payment: this.payment,
                  countPaymentStarted: aggregateResult.countPaymentStarted,
                  countImported: aggregateResult.countImported,
                },
              ) + '<br><br>';
          }

          if (aggregateResult.countNotFound) {
            resultMessage +=
              this.translate.instant(
                'page.program.import-fsp-reconciliation.import-result.not-found',
                {
                  countNotFound: aggregateResult.countNotFound,
                },
              ) + '<br><br>';
          }

          actionResult(
            this.alertController,
            this.translate,
            resultMessage,
            true,
          );
        },
        (err) => {
          this.isInProgress = false;
          console.log('err: ', err);
          actionResult(
            this.alertController,
            this.translate,
            this.translate.instant('common.import-error'),
            true,
          );
        },
      );
  }
}

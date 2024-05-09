import { formatDate } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { DateFormat } from 'src/app/enums/date-format.enum';
import { ActionType } from 'src/app/models/actions.model';
import { ImportType } from 'src/app/models/import-type.enum';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { FilePickerProps } from 'src/app/shared/file-picker-prompt/file-picker-prompt.component';
import { environment } from 'src/environments/environment';
import RegistrationStatus from '../../enums/registration-status.enum';
import { actionResult } from '../../shared/action-result';

export class AggregateImportResult {
  countImported: number;
  countExistingPhoneNr: number;
  countInvalidPhoneNr: number;
  countNotFound: number;
  countPaymentSuccess?: number;
  countPaymentFailed?: number;
}

export class ImportResult {
  public aggregateImportResult: AggregateImportResult;
  public importResult?: BulkImportResult[];
}

export enum ImportStatus {
  imported = 'imported',
  invalidPhoneNumber = 'invalidPhoneNumber',
  existingPhoneNumber = 'existingPhoneNumber',
}

export class BulkImportResult {
  public phoneNumber: string;
  public paymentAmountMultiplier: number;
  public importStatus: ImportStatus;
}

@Component({
  selector: 'app-bulk-import',
  templateUrl: './bulk-import.component.html',
  styleUrls: ['./bulk-import.component.scss'],
})
export class BulkImportComponent implements OnInit {
  @Input()
  public programId: number;

  @Input()
  public isTableLoading: boolean;

  public isInProgress = false;

  public RegistrationStatus = RegistrationStatus;
  public message: string;

  public filePickerProps: FilePickerProps;

  private locale: string;

  constructor(
    private programsService: ProgramsServiceApiService,
    private translate: TranslateService,
    private alertController: AlertController,
  ) {
    this.locale = this.translate.currentLang || environment.defaultLocale;
  }

  async ngOnInit() {
    this.message = await this.getLatestActionMessage(
      RegistrationStatus.registered,
    );
    this.filePickerProps = {
      type: 'csv',
      explanation: this.translate.instant(
        'page.program.bulk-import.registered.explanation',
      ),
      programId: this.programId,
      downloadTemplate: ImportType.registered,
    };
  }

  public importPeopleAffected(event: { file: File }) {
    this.isInProgress = true;

    this.programsService
      .import(this.programId, event.file)
      .then((response) => {
        const aggregateResult = response.aggregateImportResult;
        this.isInProgress = false;
        let resultMessage =
          this.translate.instant(
            'page.program.bulk-import.import-result.ready',
          ) + '<br><br>';

        resultMessage +=
          this.translate.instant('page.program.bulk-import.import-result.new', {
            countImported: `<strong>${aggregateResult.countImported}</strong>`,
          }) + '<br><br>';

        if (aggregateResult.countExistingPhoneNr) {
          resultMessage +=
            this.translate.instant(
              'page.program.bulk-import.import-result.existing',
              {
                countExistingPhoneNr: `<strong>${aggregateResult.countExistingPhoneNr}</strong>`,
              },
            ) + '<br><br>';
        }
        if (aggregateResult.countInvalidPhoneNr) {
          resultMessage += this.translate.instant(
            'page.program.bulk-import.import-result.invalid',
            {
              countInvalidPhoneNr: `<strong>${aggregateResult.countInvalidPhoneNr}</strong>`,
            },
          );
        }

        actionResult(this.alertController, this.translate, resultMessage, true);
      })
      .catch((err) => {
        this.isInProgress = false;
        console.log('err: ', err);
        let errorMessage = '-';
        if (err.error) {
          if (err.error.message) {
            errorMessage = err.error.message;
          } else if (err.error[0]) {
            errorMessage = JSON.stringify(err.error[0]);
          }
        }
        actionResult(
          this.alertController,
          this.translate,
          this.translate.instant('page.program.bulk-import.import-error', {
            specific: errorMessage,
          }),
        );
      });
  }

  private async getLatestActionMessage(
    type: RegistrationStatus,
  ): Promise<string> {
    let action = ActionType.importPeopleAffected;

    if (type === RegistrationStatus.registered) {
      action = ActionType.importRegistrations;
    }

    const latestAction = await this.programsService.retrieveLatestActions(
      action,
      this.programId,
    );

    if (!latestAction || !latestAction.created) {
      return '';
    }

    return this.translate.instant('page.program.bulk-import.timestamp', {
      dateTime: formatDate(
        new Date(latestAction.created),
        DateFormat.dateOnly,
        this.locale,
      ),
    });
  }
}

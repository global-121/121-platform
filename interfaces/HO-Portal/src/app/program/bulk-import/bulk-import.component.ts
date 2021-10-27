import { formatDate } from '@angular/common';
import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'src/app/auth/auth.service';
import { UserRole } from 'src/app/auth/user-role.enum';
import { ActionType } from 'src/app/models/actions.model';
import { ImportType } from 'src/app/models/import-type.enum';
import { PaStatus } from 'src/app/models/person.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { FilePickerProps } from 'src/app/shared/file-picker-prompt/file-picker-prompt.component';
import { environment } from 'src/environments/environment';

export class ImportResult {
  countImported: number;
  countExistingPhoneNr: number;
  countInvalidPhoneNr: number;
}

export enum ImportStatus {
  imported = 'imported',
  invalidPhoneNumber = 'invalidPhoneNumber',
  existingPhoneNumber = 'existingPhoneNumber',
}

@Component({
  selector: 'app-bulk-import',
  templateUrl: './bulk-import.component.html',
  styleUrls: ['./bulk-import.component.scss'],
})
export class BulkImportComponent implements OnInit {
  @Input()
  public programId: number;

  public disabled: boolean;
  public isInProgress = false;

  public PaStatus = PaStatus;
  public message: {
    [PaStatus.imported]: string;
    [PaStatus.registered]: string;
  };
  public filePickerProps: {
    [PaStatus.imported]: FilePickerProps;
    [PaStatus.registered]: FilePickerProps;
  };

  private locale: string;
  private dateFormat = 'yyyy-MM-dd, HH:mm';

  constructor(
    private authService: AuthService,
    private programsService: ProgramsServiceApiService,
    private translate: TranslateService,
    private alertController: AlertController,
  ) {
    this.locale = environment.defaultLocale;
  }

  async ngOnInit() {
    this.message = {
      [PaStatus.imported]: await this.getLatestActionMessage(PaStatus.imported),
      [PaStatus.registered]: await this.getLatestActionMessage(
        PaStatus.registered,
      ),
    };
    this.filePickerProps = {
      [PaStatus.imported]: {
        type: 'csv',
        explanation: this.translate.instant(
          'page.program.bulk-import.imported.explanation',
        ),
        programId: this.programId,
        downloadTemplate: ImportType.imported,
      },
      [PaStatus.registered]: {
        type: 'csv',
        explanation: this.translate.instant(
          'page.program.bulk-import.registered.explanation',
        ),
        programId: this.programId,
        downloadTemplate: ImportType.registered,
      },
    };
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (
      changes.programId &&
      ['string', 'number'].includes(typeof changes.programId.currentValue)
    ) {
      this.disabled = !this.btnEnabled();
    }
  }

  private btnEnabled(): boolean {
    return this.authService.hasUserRole([
      UserRole.PersonalData,
      UserRole.RunProgram,
    ]);
  }

  private aggregateImportResponse(importResponse: any[]): ImportResult {
    const aggregateImportResult = new ImportResult();
    aggregateImportResult.countImported = importResponse.filter(
      (r) => r.importStatus === ImportStatus.imported,
    ).length;
    aggregateImportResult.countInvalidPhoneNr = importResponse.filter(
      (r) => r.importStatus === ImportStatus.invalidPhoneNumber,
    ).length;
    aggregateImportResult.countExistingPhoneNr = importResponse.filter(
      (r) => r.importStatus === ImportStatus.existingPhoneNumber,
    ).length;
    return aggregateImportResult;
  }

  public exportCSV(importResponse: any[]) {
    if (importResponse.length === 0) {
      return '';
    }
    const cleanValues = (_key, value): any => (value === null ? '' : value);

    const columns = Object.keys(importResponse[0]);

    let rows = importResponse.map((row) =>
      columns
        .map((fieldName) => JSON.stringify(row[fieldName], cleanValues))
        .join(','),
    );

    rows.unshift(columns.join(',')); // Add header row

    saveAs(
      new Blob([rows.join('\r\n')], { type: 'text/csv' }),
      `import-people-affected-response-${new Date()
        .toISOString()
        .substr(0, 10)}.csv`,
    );
  }

  public importPeopleAffected(event: { file: File }, destination: PaStatus) {
    this.isInProgress = true;

    this.programsService.import(this.programId, event.file, destination).then(
      (response) => {
        const aggregateImportResult = this.aggregateImportResponse(response);
        this.isInProgress = false;
        let resultMessage =
          this.translate.instant(
            'page.program.bulk-import.import-result.ready',
          ) +
          (destination === PaStatus.imported
            ? ' ' +
              this.translate.instant(
                'page.program.bulk-import.import-result.csv',
              )
            : '') +
          '<br><br>';

        resultMessage +=
          this.translate.instant('page.program.bulk-import.import-result.new', {
            countImported: `<strong>${aggregateImportResult.countImported}</strong>`,
          }) + '<br><br>';

        if (aggregateImportResult.countExistingPhoneNr) {
          resultMessage +=
            this.translate.instant(
              'page.program.bulk-import.import-result.existing',
              {
                countExistingPhoneNr: `<strong>${aggregateImportResult.countExistingPhoneNr}</strong>`,
              },
            ) + '<br><br>';
        }
        if (aggregateImportResult.countInvalidPhoneNr) {
          resultMessage += this.translate.instant(
            'page.program.bulk-import.import-result.invalid',
            {
              countInvalidPhoneNr: `<strong>${aggregateImportResult.countInvalidPhoneNr}</strong>`,
            },
          );
        }

        this.actionResult(resultMessage, true);

        if (destination === PaStatus.imported) {
          this.exportCSV(response);
        }
      },
      (err) => {
        this.isInProgress = false;
        console.log('err: ', err);
        this.actionResult(
          this.translate.instant(
            'page.program.bulk-import.import-error.generic',
            {
              specific: err.error[0] ? JSON.stringify(err.error[0]) : '-',
              imported:
                destination === PaStatus.imported
                  ? this.translate.instant(
                      'page.program.bulk-import.import-error.imported',
                    )
                  : '',
            },
          ),
        );
      },
    );
  }

  private async actionResult(resultMessage: string, refresh: boolean = false) {
    const alert = await this.alertController.create({
      backdropDismiss: false,
      message: resultMessage,
      buttons: [
        {
          text: this.translate.instant('common.ok'),
          handler: () => {
            alert.dismiss(true);
            if (refresh) {
              window.location.reload();
            }
            return false;
          },
        },
      ],
    });
    await alert.present();
  }

  private async getLatestActionMessage(type: PaStatus): Promise<string> {
    let action = ActionType.importPeopleAffected;

    if (type === PaStatus.registered) {
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
        this.dateFormat,
        this.locale,
      ),
    });
  }
}

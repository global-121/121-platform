import { formatDate } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'src/app/auth/auth.service';
import Permission from 'src/app/auth/permission.enum';
import { ExportType } from 'src/app/models/export-type.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { environment } from 'src/environments/environment';
import { DuplicateAttributesProps } from '../../shared/confirm-prompt/confirm-prompt.component';

@Component({
  selector: 'app-export-list',
  templateUrl: './export-list.component.html',
  styleUrls: ['./export-list.component.scss'],
})
export class ExportListComponent implements OnChanges {
  @Input()
  public programId: number;

  @Input()
  public exportType: ExportType;

  @Input()
  public minPayment: number;

  @Input()
  public maxPayment: number;

  @Input()
  public disabled: boolean;

  @Input()
  public message: string;

  public isInProgress = false;

  public btnText: string;
  public subHeader: string;

  private locale: string;
  private dateFormat = 'yyyy-MM-dd, HH:mm';

  public duplicateAttributesProps: DuplicateAttributesProps;

  constructor(
    private authService: AuthService,
    private programsService: ProgramsServiceApiService,
    private translate: TranslateService,
    private alertController: AlertController,
  ) {
    this.locale = environment.defaultLocale;
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (changes.exportType && typeof changes.exportType === 'object') {
      this.updateBtnText();
      await this.updateHeaderAndMessage();
    }
  }

  private updateBtnText() {
    this.btnText = this.translate.instant(
      'page.program.export-list.' + this.exportType + '.btn-text',
    );
  }

  private async updateDisplayMessage(): Promise<void> {
    let actionTimestamp;
    if (this.authService.hasPermission(this.programId, Permission.ActionREAD)) {
      actionTimestamp = await this.getLatestActionTime();
      this.message = actionTimestamp
        ? this.translate.instant('page.program.export-list.timestamp', {
            dateTime: actionTimestamp,
          })
        : '';
    }
    if (this.exportType === ExportType.duplicates) {
      this.duplicateAttributesProps = {
        attributes: await this.programsService.getDuplicateCheckAttributes(
          this.programId,
        ),
        timestamp: actionTimestamp,
      };
    }
  }

  private async updateHeaderAndMessage() {
    this.subHeader = this.translate.instant(
      'page.program.export-list.' + this.exportType + '.confirm-message',
    );

    await this.updateDisplayMessage();
  }

  public async getExportList() {
    this.isInProgress = true;
    this.programsService
      .exportList(
        Number(this.programId),
        this.exportType,
        Number(this.minPayment),
        Number(this.maxPayment),
      )
      .then(
        (res) => {
          this.isInProgress = false;
          if (!res.data || res.data.length === 0) {
            this.actionResult(
              this.translate.instant('page.program.export-list.no-data'),
            );
            return;
          }
          this.updateHeaderAndMessage();
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

  private async getLatestActionTime(): Promise<string | null> {
    const latestAction = await this.programsService.retrieveLatestActions(
      this.exportType,
      this.programId,
    );
    if (!latestAction) {
      return null;
    }
    return formatDate(
      new Date(latestAction.created),
      this.dateFormat,
      this.locale,
    );
  }
}

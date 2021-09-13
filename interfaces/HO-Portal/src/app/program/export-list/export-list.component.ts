import { formatDate } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'src/app/auth/auth.service';
import { UserRole } from 'src/app/auth/user-role.enum';
import { ExportType } from 'src/app/models/export-type.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { environment } from 'src/environments/environment';

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
  public paymentInstallment: number;
  @Input()
  public minInstallment: number;
  @Input()
  public maxInstallment: number;
  @Input()
  public disabled: boolean;
  public isInProgress = false;

  public btnText: string;
  public subHeader: string;
  public message: string;

  private locale: string;
  private actionTimestamp: string;
  private dateFormat = 'yyyy-MM-dd, HH:mm';

  constructor(
    private authService: AuthService,
    private programsService: ProgramsServiceApiService,
    private translate: TranslateService,
    private alertController: AlertController,
  ) {
    this.locale = environment.defaultLocale;
  }

  ngOnInit() {
    this.btnText = this.translate.instant(
      'page.program.export-list.' + this.exportType + '.btn-text',
    );
    this.updateSubHeader();
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (
      changes.programId &&
      ['string', 'number'].includes(typeof changes.programId.currentValue)
    ) {
      this.disabled = !this.btnEnabled();
    }
  }

  private async updateSubHeader() {
    await this.getLatestActionTime();
    this.subHeader = this.translate.instant(
      'page.program.export-list.' + this.exportType + '.confirm-message',
    );
    this.message = this.actionTimestamp
      ? this.translate.instant('page.program.export-list.timestamp', {
          dateTime: this.actionTimestamp,
        })
      : '';
  }

  private btnEnabled() {
    return (
      this.authService.hasUserRole([UserRole.PersonalData]) &&
      this.exportType !== ExportType.payment
    );
  }

  public async getExportList() {
    this.isInProgress = true;
    this.programsService
      .exportList(
        Number(this.programId),
        this.exportType,
        Number(this.minInstallment),
        Number(this.maxInstallment),
      )
      .then(
        (res) => {
          this.isInProgress = false;
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

  public async getLatestActionTime(): Promise<void> {
    const latestAction = await this.programsService.retrieveLatestActions(
      this.exportType,
      this.programId,
    );
    if (latestAction) {
      this.actionTimestamp = formatDate(
        new Date(latestAction.created),
        this.dateFormat,
        this.locale,
      );
    }
  }
}

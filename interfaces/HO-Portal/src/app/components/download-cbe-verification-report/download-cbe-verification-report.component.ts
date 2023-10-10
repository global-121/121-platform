import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { AlertController, IonicModule } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ProgramsServiceApiService } from '../../services/programs-service-api.service';
import { actionResult } from '../../shared/action-result';
import { SharedModule } from '../../shared/shared.module';

@Component({
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule, SharedModule],
  selector: 'app-download-cbe-verification-report',
  templateUrl: './download-cbe-verification-report.component.html',
  styleUrls: ['./download-cbe-verification-report.component.scss'],
})
export class DownloadCbeVerificationReportComponent {
  @Input({ required: true })
  public programId: number;

  public isInProgress = false;
  public btnText: string;
  public subHeader: string;
  public message: string;

  constructor(
    private programsService: ProgramsServiceApiService,
    private translate: TranslateService,
    private alertController: AlertController,
  ) {
    this.btnText = this.translate.instant(
      'page.program.program-payout.cbe.btn',
    );
    this.subHeader = this.translate.instant(
      'page.program.program-payout.cbe.subHeader',
    );
    this.message = this.translate.instant(
      'page.program.program-payout.cbe.message',
    );
  }

  public async getVerificationReport() {
    this.isInProgress = true;
    this.programsService
      .getCbeVerificationReport(this.programId)
      .then((res) => {
        this.isInProgress = false;
        if (!res.data || res.data.length === 0) {
          actionResult(
            this.alertController,
            this.translate,
            this.translate.instant('page.program.export-list.no-data'),
          );
          return;
        }
      })
      .catch((error) => {
        this.isInProgress = false;
        console.error('error: ', error);
        actionResult(
          this.alertController,
          this.translate,
          this.translate.instant('common.export-error'),
        );
      })
      .finally(() => {
        this.isInProgress = false;
      });
  }
}

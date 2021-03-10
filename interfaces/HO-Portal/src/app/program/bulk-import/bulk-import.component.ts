import { formatDate } from '@angular/common';
import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'src/app/auth/auth.service';
import { UserRole } from 'src/app/auth/user-role.enum';
import { ActionType } from 'src/app/models/action-type.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { environment } from 'src/environments/environment';

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

  public btnText: string;
  public subHeader: string;
  public message: string;

  private locale: string;
  public actionTimestamp: string;
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
    this.btnText = this.translate.instant('page.program.bulk-import.btn-text');
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

  async updateSubHeader() {
    await this.getLatestActionTime();
    this.subHeader = this.translate.instant(
      'page.program.bulk-import.confirm-message',
    );
    this.message = this.actionTimestamp
      ? this.translate.instant('page.program.bulk-import.timestamp', {
          dateTime: this.actionTimestamp,
        })
      : '';
  }

  public btnEnabled() {
    return this.authService.hasUserRole([
      UserRole.PersonalData,
      UserRole.RunProgram,
    ]);
  }

  public importPeopleAffected() {
    this.isInProgress = true;
    this.programsService.import(+this.programId).then(
      (res) => {
        this.isInProgress = false;
        console.log('res: ', res);
      },
      (err) => {
        this.isInProgress = false;
        console.log('err: ', err);
        this.actionResult(
          this.translate.instant('page.program.bulk-import.import-error'),
        );
      },
    );
  }

  private async actionResult(resultMessage: string) {
    const alert = await this.alertController.create({
      message: resultMessage,
      buttons: [this.translate.instant('common.ok')],
    });
    await alert.present();
  }

  public async getLatestActionTime(): Promise<void> {
    const latestAction = await this.programsService.retrieveLatestActions(
      ActionType.importPeopleAffected,
      Number(this.programId),
    );
    if (latestAction) {
      this.actionTimestamp = formatDate(
        new Date(latestAction.timestamp),
        this.dateFormat,
        this.locale,
      );
    }
  }
}

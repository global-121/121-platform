import { formatDate } from '@angular/common';
import {
  AfterViewInit,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'src/app/auth/auth.service';
import Permission from 'src/app/auth/permission.enum';
import { ExportType } from 'src/app/models/export-type.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-export-list',
  templateUrl: './export-list.component.html',
  styleUrls: ['./export-list.component.scss'],
})
export class ExportListComponent implements OnChanges, AfterViewInit {
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
  public displayMessage: string;

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
  async ngAfterViewInit(): Promise<void> {
    this.updateBtnText();
    await this.updateHeaderAndMessage();
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (changes.exportType && typeof changes.exportType === 'object') {
      this.updateBtnText();
    }
  }

  private updateBtnText() {
    this.btnText = this.translate.instant(
      'page.program.export-list.' + this.exportType + '.btn-text',
    );
  }

  private async updateDisplayMessage(): Promise<string> {
    let resultMessage = '';
    if (this.exportType === ExportType.duplicates) {
      resultMessage = await this.createDuplicateAttributesMessage()
    }
    if (this.authService.hasPermission(Permission.ActionREAD)) {
      const actionTimestamp = await this.getLatestActionTime();
      resultMessage += actionTimestamp
        ? this.translate.instant('page.program.export-list.timestamp', {
            dateTime: actionTimestamp,
          })
        : '';
    }
    return resultMessage;
  }

  private async createDuplicateAttributesMessage(): Promise<string> {
    console.log('createDuplicateAttributesMessage: ');
    const duplicateAttributesConcactString = await this.getDuplicateAttributes();
    let duplicateAttributesMessage = '';
    const spacingHtml = '<br /> <br />';
    duplicateAttributesMessage +=
      this.translate.instant('page.program.export-list.duplicates.basedOn', {
        duplicateAttributes: duplicateAttributesConcactString
      }) + spacingHtml + this.translate.instant(
        'page.program.export-list.duplicates.canTakeFewMinutes',
      ) + spacingHtml;
    return duplicateAttributesMessage;
  }

  private async getDuplicateAttributes(): Promise<string> {
    const program = await this.programsService.getProgramById(this.programId)
    const duplicateCheckAttributeNames = [];
    for (const attr of program.programQuestions) {
      if (attr.duplicateCheck) {
        duplicateCheckAttributeNames.push(attr.name);
      }
    }
    for (const fsp of program.financialServiceProviders) {
      for (const attr of fsp.attributes) {
        if (attr.duplicateCheck) {
          duplicateCheckAttributeNames.push(attr.name);
        }
      }
    }
    let duplicateAttributesConcactString = '';
    if (duplicateCheckAttributeNames.length === 0) {
      return duplicateAttributesConcactString;
    } else {
      for (const [i, name] of duplicateCheckAttributeNames.entries()) {
        // last iteration
        if (i === duplicateCheckAttributeNames.length - 1) {
          duplicateAttributesConcactString += `${name}.`;
        } else {
          duplicateAttributesConcactString = `${name}, `;
        }
      }
    }
    return duplicateAttributesConcactString;
  }

  private async updateHeaderAndMessage() {
    this.subHeader = this.translate.instant(
      'page.program.export-list.' + this.exportType + '.confirm-message',
    );

    this.displayMessage = await this.updateDisplayMessage();
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
          if (!res.data) {
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

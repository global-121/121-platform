import { Component, OnInit, Input } from '@angular/core';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { TranslateService } from '@ngx-translate/core';
import { AlertController } from '@ionic/angular';
import { UserRole } from 'src/app/auth/user-role.enum';

@Component({
  selector: 'app-export-inclusion',
  templateUrl: './export-inclusion.component.html',
  styleUrls: ['./export-inclusion.component.scss'],
})
export class ExportInclusionComponent implements OnInit {
  @Input()
  public programId: number;

  @Input()
  public userRole: UserRole;

  constructor(
    private programsService: ProgramsServiceApiService,
    private translate: TranslateService,
    private alertController: AlertController,
  ) {}

  ngOnInit() {}

  public btnDisabled() {
    return this.userRole !== UserRole.ProgramManager;
  }

  public getInclusionList() {
    this.programsService.exportInclusionList(this.programId).then(
      (res) => {
        const blob = new Blob([res.data], { type: 'text/csv' });
        saveAs(blob, res.fileName);
      },
      (err) => {
        console.log('err: ', err);
        this.actionResult(this.translate.instant('common.export-error'));
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
}

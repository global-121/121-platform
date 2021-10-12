import { Component, Input, OnInit } from '@angular/core';
import { NgModel } from '@angular/forms';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Program } from 'src/app/models/program.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';

@Component({
  selector: 'app-disable-registration',
  templateUrl: './disable-registration.component.html',
  styleUrls: ['./disable-registration.component.scss'],
})
export class DisableRegistrationComponent implements OnInit {
  @Input()
  public programId: number;
  public publishedStatus: boolean | NgModel = false;
  constructor(
    private programsService: ProgramsServiceApiService,
    private translate: TranslateService,
    private alertController: AlertController,
  ) {}
  public program: Program;
  public msg: string;

  async ngOnInit() {
    this.program = await this.programsService.getProgramById(this.programId);
    if (!this.program) {
      return;
    }
    this.publishedStatus = this.program.published;
  }

  public async updateRegistrationStatus() {
    const dataObj = { published: !this.publishedStatus };
    this.programsService.updateProgram(this.programId, dataObj).then(
      (updatedProgram) => {
        if (updatedProgram.published) {
          this.actionResult(this.translate.instant('page.program.phases.registrationValidation.actionText-enabled-registrations'))
        }
        if (!updatedProgram.published){
          this.actionResult(this.translate.instant('page.program.phases.registrationValidation.actionText-disabled-registrations'))
        }
        this.publishedStatus = updatedProgram.published;
      },
      (error) => {
        if (error && error.error) {
          this.actionResult(error.error.message);
        }
      },
    );
  }
  private async actionResult(resultMessage: string) {
    const alert = await this.alertController.create({
      backdropDismiss: false,
      message: resultMessage,
      buttons: [
        {
          text: this.translate.instant('common.ok'),
          handler: () => {
            alert.dismiss(true);
            return false;
          },
        },
      ],
    });

    await alert.present();
  }
}

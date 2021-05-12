import { Component, Input, OnInit } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { PersonRow } from 'src/app/models/person.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';

@Component({
  selector: 'app-edit-person-affected-popup',
  templateUrl: './edit-person-affected-popup.component.html',
  styleUrls: ['./edit-person-affected-popup.component.scss'],
})
export class EditPersonAffectedPopupComponent implements OnInit {
  @Input()
  public person: PersonRow;

  public noteModel: string;
  public noteLastUpdate: string;

  constructor(
    private modalController: ModalController,
    private translate: TranslateService,
    private programsService: ProgramsServiceApiService,
    private alertController: AlertController,
  ) {}

  async ngOnInit() {
    this.getNote();
  }

  public async getNote() {
    const note = await this.programsService.retrieveNote(
      this.person.referenceId,
    );

    this.noteModel = note.note;
    this.noteLastUpdate = note.noteUpdated;
  }

  public async saveNote() {
    await this.programsService
      .updateNote(this.person.referenceId, this.noteModel)
      .then(
        (note) => {
          this.actionResult(
            this.translate.instant(
              'page.program.program-people-affected.edit-person-affected-popup.note.save-success',
            ),
          );

          this.noteLastUpdate = note.noteUpdated;
        },
        (err) => {
          console.log('err: ', err);
          if (err && err.error && err.error.error) {
            const errorMessage = this.translate.instant(
              'page.program.program-people-affected.edit-person-affected-popup.note.save-error',
              {
                error: err.error.error,
              },
            );
            this.actionResult(errorMessage);
          }
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

  public closeModal() {
    this.modalController.dismiss();
  }
}

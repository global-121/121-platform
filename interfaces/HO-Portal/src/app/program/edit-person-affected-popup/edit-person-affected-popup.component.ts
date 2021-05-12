import { formatDate } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { PersonRow } from 'src/app/models/person.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-edit-person-affected-popup',
  templateUrl: './edit-person-affected-popup.component.html',
  styleUrls: ['./edit-person-affected-popup.component.scss'],
})
export class EditPersonAffectedPopupComponent implements OnInit {
  public notes: boolean;
  public personRow: PersonRow;

  @ViewChild('input')
  public input: any;
  public inputModel: string;

  private locale: string;
  private dateFormat = 'yyyy-MM-dd, HH:mm';
  public latestUpdate: string;

  constructor(
    private modalController: ModalController,
    private translate: TranslateService,
    private programsService: ProgramsServiceApiService,
    private alertController: AlertController,
  ) {
    this.locale = environment.defaultLocale;
  }

  async ngOnInit() {
    const note = await this.programsService.retrieveNote(
      this.personRow.referenceId,
    );

    this.inputModel = note.note;

    this.latestUpdate = note.noteUpdated
      ? this.translate.instant(
          'page.program.program-people-affected.edit-person-affected-popup.note.latest-update',
          {
            timestamp: formatDate(
              note.noteUpdated,
              this.dateFormat,
              this.locale,
            ),
          },
        )
      : null;
  }

  public getTitle() {
    return this.translate.instant(
      'page.program.program-people-affected.edit-person-affected-popup.popup-title',
      {
        pa: this.personRow && this.personRow.pa ? this.personRow.pa : '',
      },
    );
  }

  public async saveNote(note: string) {
    await this.programsService
      .updateNote(this.personRow.referenceId, note)
      .then(
        () => {
          const message = this.translate.instant(
            'page.program.program-people-affected.edit-person-affected-popup.note.save-success',
          );
          this.actionResult(message, true);
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

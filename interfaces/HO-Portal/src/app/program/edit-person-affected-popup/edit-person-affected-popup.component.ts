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

  public inProgress: any = {};

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

  public async updatePaAttribute(
    attribute: string,
    value: string,
  ): Promise<void> {
    this.inProgress[attribute] = true;
    this.programsService
      .updatePaAttribute(this.person.referenceId, attribute, value)
      .then(
        () => {
          this.inProgress[attribute] = false;
        },
        (error) => {
          this.inProgress[attribute] = false;
          console.log('error: ', error);
          if (error && error.error && error.error.errors) {
            const errorMessage = this.translate.instant(
              'page.program.program-people-affected.edit-person-affected-popup.note.save-error',
              {
                error: this.formatConstraintsErrors(
                  error.error.errors,
                  attribute,
                ),
              },
            );
            this.actionResult(errorMessage);
          }
        },
      );
  }

  private formatConstraintsErrors(errors, attribute: string): string {
    const attributeError = errors.find(
      (message) => message.property === attribute,
    );
    const attributeConstraints = Object.values(attributeError.constraints);
    return '<br><br>' + attributeConstraints.join('<br>');
  }

  private async getNote() {
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
        (error) => {
          console.log('error: ', error);
          if (error && error.error && error.error.error) {
            const errorMessage = this.translate.instant(
              'page.program.program-people-affected.edit-person-affected-popup.note.save-error',
              {
                error: error.error.error,
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

import { Component, Input, OnInit } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Person } from 'src/app/models/person.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { PubSubEvent, PubSubService } from 'src/app/services/pub-sub.service';

@Component({
  selector: 'app-edit-person-affected-popup',
  templateUrl: './edit-person-affected-popup.component.html',
  styleUrls: ['./edit-person-affected-popup.component.scss'],
})
export class EditPersonAffectedPopupComponent implements OnInit {
  @Input()
  public person: Person;
  public inProgress: any = {};

  public noteModel: string;
  public noteLastUpdate: string;
  public messageHistory: any;
  public historySize = 5;

  constructor(
    private modalController: ModalController,
    private translate: TranslateService,
    private programsService: ProgramsServiceApiService,
    private alertController: AlertController,
    private pubSub: PubSubService,
  ) {}

  async ngOnInit() {
    this.getNote();
    this.getMessageHistory();
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
          this.actionResult(
            this.translate.instant('common.update-success'),
            true,
          );
        },
        (error) => {
          this.inProgress[attribute] = false;
          console.log('error: ', error);
          if (error && error.error) {
            const errorMessage = this.translate.instant('common.update-error', {
              error: this.formatErrors(error.error, attribute),
            });
            this.actionResult(errorMessage);
          }
        },
      );
  }

  private formatErrors(error, attribute: string): string {
    console.log('error: formatErrors', error);
    if (error.errors) {
      return this.formatConstraintsErrors(error, attribute);
    }
    if (error.message) {
      return '<br><br>' + error.message + '<br>';
    }
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

  private async getMessageHistory() {
    const msghistory = await this.programsService.retrieveMsgHistory(
      this.person.referenceId,
    );
    this.messageHistory = msghistory;
  }
  public async loadMore(historyLength) {
    this.historySize = historyLength;
  }

  public async saveNote() {
    this.inProgress.note = true;
    await this.programsService
      .updateNote(this.person.referenceId, this.noteModel)
      .then(
        (note) => {
          this.actionResult(
            this.translate.instant('common.update-success'),
            true,
          );
          this.noteLastUpdate = note.noteUpdated;
          this.inProgress.note = false;
        },
        (error) => {
          this.inProgress.note = false;
          console.log('error: ', error);
          if (error && error.error && error.error.error) {
            const errorMessage = this.translate.instant('common.update-error', {
              error: error.error.error,
            });
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
              this.pubSub.publish(PubSubEvent.dataRegistrationChanged);
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

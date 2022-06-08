import { Component, Input, OnInit } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import {
  Fsp,
  FspAttribute,
  FspAttributeOption,
} from 'src/app/models/fsp.model';
import { Person } from 'src/app/models/person.model';
import {
  Program,
  ProgramCustomAttribute,
  ProgramQuestion,
  ProgramQuestionOption,
} from 'src/app/models/program.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { PubSubEvent, PubSubService } from 'src/app/services/pub-sub.service';
import { TranslatableStringService } from 'src/app/services/translatable-string.service';

@Component({
  selector: 'app-edit-person-affected-popup',
  templateUrl: './edit-person-affected-popup.component.html',
  styleUrls: ['./edit-person-affected-popup.component.scss'],
})
export class EditPersonAffectedPopupComponent implements OnInit {
  @Input()
  public person: Person;

  @Input()
  public programId: number;

  @Input()
  public readOnly = false;

  @Input()
  public canViewPersonalData = false;

  @Input()
  public canUpdatePersonalData = false;

  public program: Program;

  public inProgress: any = {};
  public attributeValues: any = {};

  public noteModel: string;
  public noteLastUpdate: string;
  public messageHistory: any;
  public historySize = 5;
  public trimBodyLength = 20;
  public imageString = '(image)';
  public rowIndex: number;

  public customAttributes: {}[] = [];

  public fspList: Fsp[] = [];
  public programFspLength = 0;
  public personFsp: Fsp;

  constructor(
    private modalController: ModalController,
    private translate: TranslateService,
    private translatableString: TranslatableStringService,
    private programsService: ProgramsServiceApiService,
    private alertController: AlertController,
    private pubSub: PubSubService,
  ) {}

  async ngOnInit() {
    this.program = await this.programsService.getProgramById(this.programId);

    if (this.program && this.program.financialServiceProviders) {
      for (const fsp of this.program.financialServiceProviders) {
        this.fspList.push(await this.programsService.getFspById(fsp.id));
      }
    }

    this.attributeValues.paymentAmountMultiplier =
      this.person?.paymentAmountMultiplier;
    this.attributeValues.phoneNumber = this.person?.phoneNumber;
    this.attributeValues.whatsappPhoneNumber = this.person?.whatsappPhoneNumber;

    if (this.canViewPersonalData) {
      this.fillCustomAttributes();
      this.getNote();
      this.getMessageHistory();
    }
  }

  public async updatePaAttribute(
    attribute: string,
    value: string,
    isCustomAttribute: boolean,
  ): Promise<void> {
    if (isCustomAttribute) {
      value = String(value);
    }
    this.inProgress[attribute] = true;

    this.programsService
      .updatePaAttribute(this.person.referenceId, attribute, value)
      .then(() => {
        this.inProgress[attribute] = false;
        this.attributeValues[attribute] = value;
        this.actionResult(
          this.translate.instant('common.update-success'),
          true,
        );
      })
      .catch((error) => {
        this.inProgress[attribute] = false;
        console.log('error: ', error);
        if (error && error.error) {
          const errorMessage = this.translate.instant('common.update-error', {
            error: this.formatErrors(error.error, attribute),
          });
          this.actionResult(errorMessage);
        }
      });
  }

  private formatErrors(error, attribute: string): string {
    if (error.errors) {
      return this.formatConstraintsErrors(error.errors, attribute);
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

  private fillCustomAttributes() {
    this.programFspLength = this.fspList.length;
    for (const fspItem of this.fspList) {
      if (fspItem.fsp === this.person.fsp) {
        this.personFsp = fspItem;
      }
    }

    this.customAttributes = this.program?.programCustomAttributes.map((ca) => {
      this.attributeValues[ca.name] =
        this.person.customAttributes[ca.name].value;

      let options = null;
      if (ca.type === 'dropdown') {
        options = this.getDropdownOptions(ca);
      }

      return {
        name: ca.name,
        type: ca.type,
        label: this.translatableString.get(ca.label),
        value: this.person.customAttributes[ca.name].value,
        options,
      };
    });
  }

  private isFspAttribute(ca: ProgramCustomAttribute): boolean {
    if (!this.personFsp || !this.personFsp.attributes) {
      return false;
    }
    return this.personFsp.attributes.some((attr) => attr.name === ca.name);
  }

  private getDropdownOptions(
    ca: ProgramCustomAttribute,
  ): FspAttributeOption[] | ProgramQuestionOption[] {
    if (this.isFspAttribute(ca)) {
      return this.personFsp.attributes.find(
        (attr: FspAttribute) => attr.name === ca.name,
      ).options;
    }

    return this.program.programQuestions.find(
      (question: ProgramQuestion) => question.name === ca.name,
    ).options;
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
  public openMessageDetails(index) {
    if (index === this.rowIndex) {
      this.rowIndex = null;
    } else {
      this.rowIndex = index;
    }
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

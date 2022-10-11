import { Component, Input, OnInit } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import {
  AnswerType,
  Fsp,
  FspAttributeOption,
  FspQuestion,
} from 'src/app/models/fsp.model';
import { Person } from 'src/app/models/person.model';
import {
  Program,
  ProgramQuestion,
  ProgramQuestionOption,
} from 'src/app/models/program.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { PubSubEvent, PubSubService } from 'src/app/services/pub-sub.service';
import { TranslatableStringService } from 'src/app/services/translatable-string.service';
import { Attribute } from '../../models/attribute.model';

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

  @Input()
  public canViewMessageHistory = false;

  public program: Program;
  private paTableAttributesInput: Program['editableAttributes'];

  public inProgress: any = {};
  public attributeValues: any = {};

  public noteModel: string;
  public noteLastUpdate: string;
  public messageHistory: any;
  public historySize = 5;
  public trimBodyLength = 20;
  public imageString = '(image)';
  public rowIndex: number;

  public paTableAttributes: {}[] = [];

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

    if (this.program && this.program.editableAttributes) {
      this.paTableAttributesInput = this.program.editableAttributes;
      const fspObject = this.fspList.find((f) => f.fsp === this.person?.fsp);
      if (fspObject && fspObject.editableAttributes) {
        this.paTableAttributesInput = fspObject.editableAttributes.concat(
          this.paTableAttributesInput,
        );
      }
    }

    if (this.canViewPersonalData) {
      this.fillPaTableAttributes();
      this.getNote();
    }
    if (this.canViewMessageHistory) {
      this.getMessageHistory();
    }
  }

  public async updatePaAttribute(
    attribute: string,
    value: string | string[],
    isPaTableAttribute: boolean,
  ): Promise<void> {
    if (isPaTableAttribute && !Array.isArray(value)) {
      value = String(value);
    }
    this.inProgress[attribute] = true;

    this.programsService
      .updatePaAttribute(
        this.programId,
        this.person.referenceId,
        attribute,
        value,
      )
      .then((response: Person) => {
        this.inProgress[attribute] = false;
        this.attributeValues[attribute] = value;
        this.attributeValues.paymentAmountMultiplier =
          response.paymentAmountMultiplier;
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
            error: this.formatErrors(error.error),
          });
          this.actionResult(errorMessage);
        }
      });
  }

  private formatErrors(error): string {
    if (error.statusCode === 400) {
      return this.formatConstraintsErrors(error.message);
    }
    if (error.message) {
      return '<br><br>' + error.message + '<br>';
    }
  }

  private formatConstraintsErrors(errors): string {
    let attributeConstraints = [];
    for (const error of errors) {
      attributeConstraints = attributeConstraints.concat(
        Object.values(error.constraints),
      );
    }
    return '<br><br>' + attributeConstraints.join('<br>');
  }

  private fillPaTableAttributes() {
    this.programFspLength = this.fspList.length;
    for (const fspItem of this.fspList) {
      if (fspItem.fsp === this.person.fsp) {
        this.personFsp = fspItem;
      }
    }

    this.paTableAttributes = this.paTableAttributesInput.map(
      (paTableAttribute) => {
        this.attributeValues[paTableAttribute.name] =
          this.person.paTableAttributes[paTableAttribute.name].value;

        let options = null;
        if (
          paTableAttribute.type === AnswerType.Enum ||
          paTableAttribute.type === AnswerType.MultiSelect
        ) {
          options = this.getDropdownOptions(paTableAttribute);
        }
        const translationKey = `page.program.program-people-affected.edit-person-affected-popup.properties.${paTableAttribute.name}`;
        let label = this.translate.instant(translationKey).shortLabel;
        if (!label) {
          label = this.translatableString.get(paTableAttribute.shortLabel);
        }
        return {
          name: paTableAttribute.name,
          type: paTableAttribute.type,
          label,
          value: this.person.paTableAttributes[paTableAttribute.name].value,
          options,
          explanation: this.translate.instant(translationKey).explanation,
        };
      },
    );
  }

  private isFspAttribute(paTableAttribute: Attribute): boolean {
    if (!this.personFsp || !this.personFsp.questions) {
      return false;
    }
    return this.personFsp.questions.some(
      (attr) => attr.name === paTableAttribute.name,
    );
  }

  private getDropdownOptions(
    paTableAttribute: Attribute,
  ): FspAttributeOption[] | ProgramQuestionOption[] {
    if (this.isFspAttribute(paTableAttribute)) {
      return this.personFsp.questions.find(
        (attr: FspQuestion) => attr.name === paTableAttribute.name,
      ).options;
    }

    return this.program.programQuestions.find(
      (question: ProgramQuestion) => question.name === paTableAttribute.name,
    ).options;
  }

  private async getNote() {
    const note = await this.programsService.retrieveNote(
      this.programId,
      this.person.referenceId,
    );

    this.noteModel = note.note;
    this.noteLastUpdate = note.noteUpdated;
  }

  private async getMessageHistory() {
    const msghistory = await this.programsService.retrieveMsgHistory(
      this.programId,
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
      .updateNote(this.programId, this.person.referenceId, this.noteModel)
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

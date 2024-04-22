import { Component, Input, OnInit } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { DateFormat } from 'src/app/enums/date-format.enum';
import {
  AnswerType,
  Fsp,
  FspAttributeOption,
  FspQuestion,
} from 'src/app/models/fsp.model';
import { Person, PersonDefaultAttributes } from 'src/app/models/person.model';
import {
  Program,
  ProgramQuestion,
  ProgramQuestionOption,
} from 'src/app/models/program.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { PubSubEvent, PubSubService } from 'src/app/services/pub-sub.service';
import { TranslatableStringService } from 'src/app/services/translatable-string.service';
import { Attribute } from '../../models/attribute.model';
import { EnumService } from '../../services/enum.service';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { actionResult } from '../../shared/action-result';

@Component({
  selector: 'app-edit-person-affected-popup',
  templateUrl: './edit-person-affected-popup.component.html',
  styleUrls: ['./edit-person-affected-popup.component.scss'],
})
export class EditPersonAffectedPopupComponent implements OnInit {
  @Input({ required: true })
  public programId: number;

  @Input({ required: true })
  public referenceId: string;

  @Input({ required: true })
  public canUpdatePaData = false;

  @Input({ required: true })
  public canViewPersonalData = false;

  @Input({ required: true })
  public canUpdateRegistrationAttributeFinancial = false;

  @Input({ required: true })
  public canUpdatePersonalData = false;

  @Input({ required: true })
  public canUpdatePaFsp = false;

  @Input({ required: true })
  public canViewMessageHistory = false;

  @Input({ required: true })
  public canViewPaymentData = false;

  public showScopeField = false;

  public person: Person;

  public DateFormat = DateFormat;
  public inProgress: any = {};

  public program: Program;
  public attributeValues: any = {};
  public paTableAttributes: Attribute[] = [];
  private paTableAttributesInput: Program['editableAttributes'];

  public fspList: Fsp[] = [];
  public programFspLength = 0;
  public personFsp: Fsp;

  public availableLanguages = [];

  public alreadyReceivedPayments = 0;

  public loading: boolean;

  constructor(
    private modalController: ModalController,
    private translate: TranslateService,
    private translatableString: TranslatableStringService,
    private programsService: ProgramsServiceApiService,
    private alertController: AlertController,
    private pubSub: PubSubService,
    private errorHandlerService: ErrorHandlerService,
    private enumService: EnumService,
  ) {}

  async ngOnInit() {
    this.loading = true;
    this.program = await this.programsService.getProgramById(this.programId);
    this.availableLanguages = this.getAvailableLanguages();

    if (this.program && this.program.financialServiceProviders) {
      for (const fsp of this.program.financialServiceProviders) {
        const fspDetails = await this.programsService.getFspById(fsp.id);
        fspDetails.displayName = Object.assign(
          {},
          fspDetails.displayName,
          fsp.displayName,
        );
        this.fspList.push(fspDetails);
      }
    }

    this.person = (
      await this.programsService.getPeopleAffected(
        this.programId,
        1,
        1,
        this.referenceId,
      )
    ).data?.[0];

    this.attributeValues.paymentAmountMultiplier =
      this.person?.paymentAmountMultiplier;

    if (this.showMaxPaymentsField()) {
      this.attributeValues.maxPayments = this.person?.maxPayments;
    }
    this.attributeValues.phoneNumber = this.person?.phoneNumber;
    this.attributeValues.preferredLanguage = this.person?.preferredLanguage;

    if (this.program && this.program.editableAttributes) {
      this.paTableAttributesInput = this.program.editableAttributes;

      const fspObject = this.fspList.find(
        (f) => f.fsp === this.person?.financialServiceProvider,
      );
      if (fspObject && fspObject.editableAttributes) {
        this.paTableAttributesInput = fspObject.editableAttributes.concat(
          this.paTableAttributesInput,
        );
      }
    }

    if (this.canViewPersonalData) {
      this.fillPaTableAttributes();
    }

    this.showScopeField = this.program.enableScope;
    if (this.showScopeField) {
      this.attributeValues.scope = this.person?.scope;
    }

    if (this.person?.fspDisplayName) {
      this.person.fspDisplayName = this.translatableString.get(
        this.person.fspDisplayName,
      );
    }

    this.loading = false;
  }

  public async updatePaAttribute(
    attribute: string,
    value: string | number | string[],
    reason: string,
    isPaTableAttribute: boolean,
  ): Promise<void> {
    let valueToStore: string | number | string[];

    valueToStore = value;

    if (isPaTableAttribute && !Array.isArray(value)) {
      valueToStore = String(value);
    }
    this.inProgress[attribute] = true;

    if (attribute === PersonDefaultAttributes.paymentAmountMultiplier) {
      if (!Number.isInteger(Number(value))) {
        this.showAttributeErrorAlert('not-an-integer', attribute);
        return;
      }

      valueToStore = Number(value);
    }

    if (
      !this.program.allowEmptyPhoneNumber &&
      attribute === PersonDefaultAttributes.phoneNumber
    ) {
      if (!value || value === '') {
        this.showAttributeErrorAlert('not-empty', attribute);
        return;
      }
      valueToStore = value;
    }

    if (attribute === PersonDefaultAttributes.maxPayments) {
      if (!Number.isInteger(Number(value))) {
        this.showAttributeErrorAlert('not-an-integer', attribute);
        return;
      }

      if (
        value !== '' &&
        (Number(value) === 0 || Number(value) <= this.person.paymentCount)
      ) {
        this.showAttributeErrorAlert('too-low', attribute);
        return;
      }

      if (!value || value === '') {
        valueToStore = null;
      } else {
        valueToStore = Number(value);
      }
    }

    this.programsService
      .updatePaAttribute(
        this.programId,
        this.person.referenceId,
        attribute,
        valueToStore,
        reason,
      )
      .then((response: Person) => {
        console.log(
          '🚀 ~ file: edit-person-affected-popup.component.ts:197 ~ EditPersonAffectedPopupComponent ~ .then ~ response:',
          response,
        );
        this.inProgress[attribute] = false;
        this.attributeValues[attribute] = valueToStore;
        this.attributeValues.paymentAmountMultiplier =
          response.paymentAmountMultiplier;
        actionResult(
          this.alertController,
          this.translate,
          this.translate.instant('common.update-success'),
          true,
          PubSubEvent.dataRegistrationChanged,
          this.pubSub,
        );
      })
      .catch((error) => {
        this.inProgress[attribute] = false;
        console.log('error: ', error);
        if (error && error.error) {
          const errorMessage = this.translate.instant(
            'common.error-with-message',
            {
              error: this.errorHandlerService.formatErrors(error),
            },
          );
          actionResult(this.alertController, this.translate, errorMessage);
        }
      });
  }

  private showAttributeErrorAlert(
    errorType: string,
    attribute: PersonDefaultAttributes,
  ) {
    const errorKeyPrefix =
      'page.program.program-people-affected.edit-person-affected-popup.properties';
    const errorMessage = this.translate.instant('common.error-with-message', {
      error: this.translate.instant(`${errorKeyPrefix}.error.${errorType}`),
    });
    actionResult(this.alertController, this.translate, errorMessage);
    this.inProgress[attribute] = false;
  }

  private fillPaTableAttributes() {
    this.programFspLength = this.fspList.length;
    for (const fspItem of this.fspList) {
      if (fspItem.fsp === this.person.financialServiceProvider) {
        this.personFsp = fspItem;
      }
    }

    this.paTableAttributes = this.paTableAttributesInput.map(
      (paTableAttribute) => {
        this.attributeValues[paTableAttribute.name] =
          this.person[paTableAttribute.name];

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
          value: this.person[paTableAttribute.name],
          options,
          pattern: paTableAttribute.pattern,
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
      const fspQuestion = this.personFsp.questions.find(
        (attr: FspQuestion) => attr.name === paTableAttribute.name,
      );
      return fspQuestion.options ? fspQuestion.options : [];
    }

    const programQuestion = this.program.programQuestions.find(
      (question: ProgramQuestion) => question.name === paTableAttribute.name,
    );

    return programQuestion.options ? programQuestion.options : [];
  }

  public closeModal() {
    this.modalController.dismiss();
  }

  private getAvailableLanguages(): object[] {
    return this.program.languages.map((key) => ({
      option: key,
      label: this.enumService.getEnumLabel('preferredLanguage', key),
    }));
  }

  public showMaxPaymentsField() {
    return this.program?.enableMaxPayments;
  }
}

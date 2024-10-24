import { Component, Input, OnInit } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { DateFormat } from 'src/app/enums/date-format.enum';
import { FinancialServiceProviderConfiguration } from 'src/app/models/fsp.model';
import { Person, PersonDefaultAttributes } from 'src/app/models/person.model';
import {
  Program,
  ProgramRegistrationAttribute,
  ProgramRegistrationAttributeOption,
} from 'src/app/models/program.model';
import { RegistrationAttributeType } from 'src/app/models/registration-attribute.model';
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
  public canUpdatePaProgramFspConfig = false;

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

  public programFspConfigList: FinancialServiceProviderConfiguration[] = [];
  public programFspLength = 0;
  public personFsp: FinancialServiceProviderConfiguration;

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

    if (this.program && this.program.financialServiceProviderConfigurations) {
      this.programFspConfigList =
        this.program.financialServiceProviderConfigurations;
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
      // Filter out the phoneNumber attribute here, because it always added to the edit PA popup, regardless of the program configuration as it is also a field in the RegistrationEntity
      this.paTableAttributesInput = this.program.editableAttributes.filter(
        (attribute) => attribute.name !== 'phoneNumber',
      );
    }

    if (this.canViewPersonalData) {
      this.fillPaTableAttributes();
    }

    this.showScopeField = this.program.enableScope;
    if (this.showScopeField) {
      this.attributeValues.scope = this.person?.scope;
    }

    if (this.person?.programFinancialServiceProviderConfigurationLabel) {
      this.person.programFinancialServiceProviderConfigurationLabel =
        this.translatableString.get(
          this.person.programFinancialServiceProviderConfigurationLabel,
        );
    }

    this.loading = false;
  }

  public async updatePaAttribute(
    attribute: string,
    value: string | number | string[],
    reason: string,
    isProgramRegistrationAttribute: boolean,
  ): Promise<void> {
    let valueToStore: string | number | string[];

    valueToStore = value;

    if (isProgramRegistrationAttribute && value === '') {
      valueToStore = null;
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
        (Number(value) === 0 || Number(value) < this.person.paymentCount)
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
    this.programFspLength = this.programFspConfigList.length;
    for (const fspItem of this.programFspConfigList) {
      if (fspItem.name === this.person.financialServiceProviderName) {
        this.personFsp = fspItem;
      }
    }

    this.paTableAttributes = this.paTableAttributesInput.map(
      (paTableAttribute) => {
        this.attributeValues[paTableAttribute.name] =
          this.person[paTableAttribute.name];

        let options = null;
        if (
          paTableAttribute.type === RegistrationAttributeType.Enum ||
          paTableAttribute.type === RegistrationAttributeType.MultiSelect
        ) {
          options = this.getDropdownOptions(paTableAttribute);
        }
        const translationKey = `page.program.program-people-affected.edit-person-affected-popup.properties.${paTableAttribute.name}`;
        let label = this.translate.instant(translationKey).label;
        if (!label) {
          label = this.translatableString.get(paTableAttribute.label);
        }
        return {
          name: paTableAttribute.name,
          type: paTableAttribute.type,
          isRequired: paTableAttribute.isRequired,
          label,
          value: this.person[paTableAttribute.name],
          options,
          pattern: paTableAttribute.pattern,
          explanation: this.translate.instant(translationKey).explanation,
        };
      },
    );
  }

  private getDropdownOptions(
    paTableAttribute: Attribute,
  ): ProgramRegistrationAttributeOption[] {
    const programRegistrationAttribute =
      this.program.programRegistrationAttributes.find(
        (attribute: ProgramRegistrationAttribute) =>
          attribute.name === paTableAttribute.name,
      );

    return programRegistrationAttribute.options
      ? programRegistrationAttribute.options
      : [];
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

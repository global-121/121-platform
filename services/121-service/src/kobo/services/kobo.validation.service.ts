import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { isDefined } from 'class-validator';
import { Equal } from 'typeorm';

import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { FINANCIAL_SERVICE_PROVIDER_ATTRIBUTE_TYPE_MAPPING } from '@121-service/src/fsp-management/fsp-attribute-type-mapping';
import { getFspAttributeNames } from '@121-service/src/fsp-management/fsp-settings.helpers';
import { KOBO_ALLOWED_REGISTRATION_VIEW_ATTRIBUTES } from '@121-service/src/kobo/consts/kobo-allowed-registration-view-attributes.const';
import { KOBO_TO_121_TYPE_MAPPING } from '@121-service/src/kobo/consts/kobo-survey-to-121-attribute-type.const';
import { KoboValidationErrorType } from '@121-service/src/kobo/enum/kobo-validation-error-type';
import { KoboFormDefinition } from '@121-service/src/kobo/interfaces/kobo-form-definition.interface';
import { KoboSurveyItemCleaned } from '@121-service/src/kobo/interfaces/kobo-survey-item-cleaned.interface';
import { KoboValidationError } from '@121-service/src/kobo/interfaces/kobo-validation-error.interface';
import { KoboLanguageMapper } from '@121-service/src/kobo/mappers/kobo-language.mapper';
import { fspQuestionName } from '@121-service/src/kobo/services/kobo.service';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { ProgramRepository } from '@121-service/src/programs/repositories/program.repository';
import { RegistrationViewEntity } from '@121-service/src/registration/entities/registration-view.entity';
import {
  DefaultRegistrationDataAttributeNames,
  GenericRegistrationAttributes,
  RegistrationAttributeTypes,
} from '@121-service/src/registration/enum/registration-attribute.enum';
import { registrationViewAttributeNames } from '@121-service/src/shared/const';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';

// These Kobo field types are accepted for any 121 attribute type because cash-im teams use them for computed/pre-filled values
const KOBO_TYPES_ALLOWED_FOR_ANY_ATTRIBUTE = ['hidden', 'calculate'] as const;

@Injectable()
export class KoboValidationService {
  constructor(
    private readonly programRepository: ProgramRepository,
    private readonly programFspConfigurationRepository: ProgramFspConfigurationRepository,
  ) {}

  public async validateKoboFormDefinition({
    formDefinition,
    programId,
  }: {
    formDefinition: KoboFormDefinition;
    programId: number;
  }): Promise<void> {
    // Fetch all required data at the beginning
    const program = await this.programRepository.findOneOrFail({
      where: { id: Equal(programId) },
      select: {
        fullnameNamingConvention: true,
        allowEmptyPhoneNumber: true,
        enableScope: true,
      },
    });

    const fspConfigs = await this.programFspConfigurationRepository.find({
      where: { programId: Equal(programId) },
      select: {
        fspName: true,
        name: true,
      },
    });

    let errors = this.validateFspAttributes({
      koboSurveyItems: formDefinition.survey,
      fspConfigs,
    });

    errors = this.collectErrors({
      accumulatedErrors: errors,
      error: this.validateFormHasEnglishLanguage({
        languages: formDefinition.languages,
      }),
    });

    errors = this.collectErrors({
      accumulatedErrors: errors,
      error: this.validateFullNameNamingConventionInKoboSurveyItems({
        koboSurveyItems: formDefinition.survey,
        fullnameNamingConvention: program.fullnameNamingConvention ?? [],
      }),
    });

    errors = this.collectErrors({
      accumulatedErrors: errors,
      error: this.validatePhoneNumberSurveyItem({
        koboSurveyItems: formDefinition.survey,
        allowEmptyPhoneNumber: program.allowEmptyPhoneNumber,
      }),
    });

    errors = this.collectErrors({
      accumulatedErrors: errors,
      error: this.validateScopeInKoboSurveyItems({
        koboSurveyItems: formDefinition.survey,
        scopeEnabled: program.enableScope,
      }),
    });

    errors = this.collectErrors({
      accumulatedErrors: errors,
      error: this.validateNoMatrixType(formDefinition.survey),
    });

    errors = this.collectErrors({
      accumulatedErrors: errors,
      error: this.validateKoboLanguageCodes({
        koboSurveyLanguages: formDefinition.languages,
      }),
    });

    errors = this.collectErrors({
      accumulatedErrors: errors,
      error: this.validateAllowedRegistrationViewAttributeTypes({
        koboSurveyItems: formDefinition.survey,
      }),
    });

    errors = this.collectErrors({
      accumulatedErrors: errors,
      error: this.validateForbiddenRegistrationViewAttributes({
        koboSurveyItems: formDefinition.survey,
      }),
    });

    errors = this.collectErrors({
      accumulatedErrors: errors,
      error: this.validateFspQuestion({
        koboSurveyItems: formDefinition.survey,
        fspConfigs,
      }),
    });

    errors = this.collectErrors({
      accumulatedErrors: errors,
      error: this.validateSelectOneHasChoices({
        koboSurveyItems: formDefinition.survey,
      }),
    });

    this.throwErrorsIfAny(errors);
  }

  private throwErrorsIfAny(errors: KoboValidationError[]): void {
    if (errors.length > 0) {
      throw new HttpException(
        { message: 'Kobo form definition validation failed', errors },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private validateFspAttributes({
    koboSurveyItems,
    fspConfigs,
  }: {
    koboSurveyItems: KoboSurveyItemCleaned[];
    fspConfigs: { fspName: Fsps; name: string }[];
  }): KoboValidationError[] {
    const errors: KoboValidationError[] = [];

    for (const fspConfig of fspConfigs) {
      errors.push(
        ...this.validateFspAttributesTyping({ koboSurveyItems, fspConfig }),
      );
      errors.push(
        ...this.validateFspAttributesExistInForm({
          koboSurveyItems,
          fspConfig,
        }),
      );
    }

    return errors;
  }

  private validateFspAttributesExistInForm({
    koboSurveyItems,
    fspConfig,
  }: {
    koboSurveyItems: KoboSurveyItemCleaned[];
    fspConfig: { fspName: Fsps; name: string };
  }): KoboValidationError[] {
    const attributes = getFspAttributeNames(fspConfig.fspName);

    return attributes
      .filter(
        (attribute) => !koboSurveyItems.find((item) => item.name === attribute),
      )
      .map((attribute) => ({
        type: KoboValidationErrorType.missingField as const,
        attributeName: attribute,
        error: `Attribute '${attribute}' is missing`,
        solution: `Add '${attribute}' to the Kobo form`,
      }));
  }

  private validateFspAttributesTyping({
    koboSurveyItems,
    fspConfig,
  }: {
    koboSurveyItems: KoboSurveyItemCleaned[];
    fspConfig: { fspName: Fsps; name: string };
  }): KoboValidationError[] {
    const fspAttributeNames = getFspAttributeNames(fspConfig.fspName);
    const errors: KoboValidationError[] = [];

    for (const fspAttributeName of fspAttributeNames) {
      const error = this.validateSingleFspAttributeType({
        koboSurveyItems,
        fspAttributeName,
      });

      if (error) {
        errors.push(error);
      }
    }

    return errors;
  }

  private validateSingleFspAttributeType({
    koboSurveyItems,
    fspAttributeName,
  }: {
    koboSurveyItems: KoboSurveyItemCleaned[];
    fspAttributeName: string;
  }): KoboValidationError | undefined {
    const surveyItem = koboSurveyItems.find(
      (item) => item.name === fspAttributeName,
    );

    // If the attribute is missing, the existence validation will have caught this and we can skip type validation
    if (!surveyItem) {
      return;
    }

    return this.validateSurveyItemTypeMatchExpected121Type({
      attributeName: fspAttributeName,
      surveyItemType: surveyItem.type,
      expected121Type:
        FINANCIAL_SERVICE_PROVIDER_ATTRIBUTE_TYPE_MAPPING[fspAttributeName],
    });
  }

  private validateFullNameNamingConventionInKoboSurveyItems({
    koboSurveyItems,
    fullnameNamingConvention,
  }: {
    koboSurveyItems: KoboSurveyItemCleaned[];
    fullnameNamingConvention: string[];
  }): KoboValidationError[] {
    const koboAttributeNames = new Set(
      koboSurveyItems.map((item) => item.name),
    );

    const missingAttributes = fullnameNamingConvention.filter(
      (attr) => !koboAttributeNames.has(attr),
    );

    if (missingAttributes.length === 0) {
      return [];
    }

    return missingAttributes.map((missingAttribute) => ({
      type: KoboValidationErrorType.missingFullnameAttributes,
      attributeName: missingAttribute,
      error: `Attribute '${missingAttribute}' is missing`,
      solution: `Add the missing attribute to the Kobo form`,
    }));
  }

  private validateFormHasEnglishLanguage({
    languages,
  }: {
    languages: (string | undefined)[];
  }): KoboValidationError | undefined {
    for (const language of languages) {
      const isoCode = KoboLanguageMapper.extractIsoCode({
        koboSurveyLanguage: language,
      });
      if (isoCode === RegistrationPreferredLanguage.en) {
        return;
      }
    }
    return {
      type: KoboValidationErrorType.missingEnglishLanguage,
      attributeName: 'languages',
      error: 'English (en) is missing as a form language',
      solution: 'Add English (en) as a language in your Kobo form.',
    };
  }

  // Phone number is a special case in validation as it part of the registration entity and not only a program registration attribute
  private validatePhoneNumberSurveyItem({
    koboSurveyItems,
    allowEmptyPhoneNumber,
  }: {
    koboSurveyItems: KoboSurveyItemCleaned[];
    allowEmptyPhoneNumber: boolean;
  }): KoboValidationError[] {
    const errors: KoboValidationError[] = [];

    const phoneNumberItem = koboSurveyItems.find(
      (item) => item.name === DefaultRegistrationDataAttributeNames.phoneNumber,
    );

    // Only validate existence if empty phone numbers are not allowed
    if (!phoneNumberItem && !allowEmptyPhoneNumber) {
      errors.push({
        type: KoboValidationErrorType.missingField,
        attributeName: DefaultRegistrationDataAttributeNames.phoneNumber,
        error: `Attribute '${DefaultRegistrationDataAttributeNames.phoneNumber}' is missing`,
        solution:
          'Add a phoneNumber field with text type including country code, or set program.allowEmptyPhoneNumber to true',
      });
    }

    if (!phoneNumberItem) {
      return errors;
    }

    // Also validate type if the phone number item exists
    const error = this.validateSurveyItemTypeMatchExpected121Type({
      attributeName: DefaultRegistrationDataAttributeNames.phoneNumber,
      surveyItemType: phoneNumberItem.type,
      expected121Type: RegistrationAttributeTypes.tel,
    });
    if (error) {
      errors.push(error);
    }

    return errors;
  }

  private validateScopeInKoboSurveyItems({
    koboSurveyItems,
    scopeEnabled,
  }: {
    koboSurveyItems: KoboSurveyItemCleaned[];
    scopeEnabled: boolean;
  }): KoboValidationError | undefined {
    if (!scopeEnabled) {
      return;
    }
    const scopeItem = koboSurveyItems.find(
      (item) => item.name === GenericRegistrationAttributes.scope,
    );
    if (!scopeItem) {
      return {
        type: KoboValidationErrorType.missingField,
        attributeName: GenericRegistrationAttributes.scope,
        error: `Attribute '${GenericRegistrationAttributes.scope}' is missing`,
        solution:
          'Add a scope field to the Kobo form (required when program.enableScope is true)',
      };
    }

    return this.validateSurveyItemTypeMatchExpected121Type({
      attributeName: GenericRegistrationAttributes.scope,
      surveyItemType: scopeItem.type,
      expected121Type: RegistrationAttributeTypes.text,
    });
  }

  private validateNoMatrixType(
    koboSurveyItems: KoboSurveyItemCleaned[],
  ): KoboValidationError | undefined {
    const typeName = 'begin_kobomatrix';
    const matrixItem = koboSurveyItems.find((item) => item.type === typeName);
    if (matrixItem) {
      return {
        type: KoboValidationErrorType.matrixTypeFound,
        attributeName: matrixItem.name,
        error: `Form contains a matrix question, which isn't supported`,
        solution: 'Remove the matrix item from the Kobo form',
      };
    }
  }

  private validateKoboLanguageCodes({
    koboSurveyLanguages,
  }: {
    koboSurveyLanguages: (string | undefined)[];
  }): KoboValidationError[] {
    return koboSurveyLanguages
      .filter((language) => {
        const isoCode = KoboLanguageMapper.extractIsoCode({
          koboSurveyLanguage: language,
        });
        return !isoCode;
      })
      .map((language) => ({
        type: KoboValidationErrorType.invalidLanguageCode as const,
        attributeName: language ?? '-',
        error: `Invalid language code: '${language}'`,
        solution: 'use a valid ISO 639 language code.', // <--- Lowercase on purpose, because we mash it together on the FE
        info: `See https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes for valid codes`,
      }));
  }

  private validateSurveyItemTypeMatchExpected121Type({
    attributeName,
    surveyItemType,
    expected121Type,
  }: {
    attributeName: string;
    surveyItemType: string;
    expected121Type: RegistrationAttributeTypes;
  }): KoboValidationError | undefined {
    // Hidden and 'calculate' fields are allowed for any attribute type as they are now used by our cash-im team for any values
    // They are too difficult to validate as of this moment
    if (
      (KOBO_TYPES_ALLOWED_FOR_ANY_ATTRIBUTE as readonly string[]).includes(
        surveyItemType,
      )
    ) {
      return;
    }

    const expectedKoboTypes = this.getKoboTypesFrom121Type(expected121Type);
    // There is no direct mapping for tel to Kobo types, so we use text as acceptable type
    if (expected121Type === RegistrationAttributeTypes.tel) {
      expectedKoboTypes.push('text');
    }

    if (!expectedKoboTypes.includes(surveyItemType)) {
      return {
        type: KoboValidationErrorType.typeMismatch,
        attributeName,
        error: `Field type must not be '${surveyItemType}'`,
        solution: `Change the field type to an accepted type`,
        info: `Expected one of: ${expectedKoboTypes.map((t) => `'${t}'`).join(', ')}`,
      };
    }
  }

  private getKoboTypesFrom121Type(type: string): string[] {
    return Object.entries(KOBO_TO_121_TYPE_MAPPING)
      .filter(([_, value]) => value === type)
      .map(([key]) => key);
  }

  private validateAllowedRegistrationViewAttributeTypes({
    koboSurveyItems,
  }: {
    koboSurveyItems: KoboSurveyItemCleaned[];
  }): KoboValidationError[] {
    const hasRegistrationViewAttributeName = (item: KoboSurveyItemCleaned) => {
      return registrationViewAttributeNames.includes(item.name);
    };

    const hasExpectedType = (item: KoboSurveyItemCleaned) => {
      return item.name in KOBO_ALLOWED_REGISTRATION_VIEW_ATTRIBUTES;
    };

    const getError = ({ name, type }: KoboSurveyItemCleaned) => {
      return this.validateSurveyItemTypeMatchExpected121Type({
        attributeName: name,
        surveyItemType: type,
        expected121Type: KOBO_ALLOWED_REGISTRATION_VIEW_ATTRIBUTES[name],
      });
    };

    const errorMessages = koboSurveyItems
      .filter(hasRegistrationViewAttributeName)
      .filter(hasExpectedType)
      .map(getError)
      .filter(isDefined);

    return errorMessages;
  }

  private validateForbiddenRegistrationViewAttributes({
    koboSurveyItems,
  }: {
    koboSurveyItems: KoboSurveyItemCleaned[];
  }): KoboValidationError[] {
    const isNotScope = (surveyItem: KoboSurveyItemCleaned) =>
      surveyItem.name !== GenericRegistrationAttributes.scope;

    const isForbiddenAttribute = (surveyItem: KoboSurveyItemCleaned) =>
      this.isRegistrationViewAttributeName(surveyItem.name) &&
      !KOBO_ALLOWED_REGISTRATION_VIEW_ATTRIBUTES[surveyItem.name];

    const errorMessages = koboSurveyItems
      .filter(isNotScope)
      .filter(isForbiddenAttribute)
      .map((surveyItem) => ({
        type: KoboValidationErrorType.forbiddenAttribute as const,
        attributeName: surveyItem.name,
        error: `'${surveyItem.name}' is a reserved attribute name and cannot be filled from Kobo`,
        solution: `Rename the field '${surveyItem.name}' to a non-reserved name`,
      }));

    return errorMessages;
  }

  private isRegistrationViewAttributeName(
    name: string,
  ): name is keyof RegistrationViewEntity {
    return registrationViewAttributeNames.includes(name);
  }

  private validateFspQuestion({
    koboSurveyItems,
    fspConfigs,
  }: {
    koboSurveyItems: KoboSurveyItemCleaned[];
    fspConfigs: { fspName: Fsps; name: string }[];
  }): KoboValidationError | undefined {
    const fspItem = koboSurveyItems.find(
      (item) => item.name === fspQuestionName,
    );
    if (!fspItem) {
      return {
        type: KoboValidationErrorType.missingField,
        attributeName: fspQuestionName,
        error: `Field is missing from your form`,
        solution: `Add a field named '${fspQuestionName}' to the Kobo form`,
      };
    }

    const validTypes = new Set([
      ...KOBO_TYPES_ALLOWED_FOR_ANY_ATTRIBUTE,
      'select_one',
    ]);

    if (!validTypes.has(fspItem.type)) {
      return {
        type: KoboValidationErrorType.typeMismatch,
        attributeName: fspQuestionName,
        error: `Attribute '${fspQuestionName}' has incompatible type '${fspItem.type}'`,
        solution: `Change the field type to an accepted type`,
        info: `Expected one of: ${[...validTypes].map((t) => `'${t}'`).join(', ')}`,
      };
    }

    // If it's a select_one, validate that the choices match the FSP configuration names
    if (fspItem.type === 'select_one' && fspItem.choices.length > 0) {
      return this.validateFspQuestionChoices({ fspItem, fspConfigs });
    }
  }

  private validateFspQuestionChoices({
    fspItem,
    fspConfigs,
  }: {
    fspItem: KoboSurveyItemCleaned;
    fspConfigs: { fspName: Fsps; name: string }[];
  }): KoboValidationError | undefined {
    const fspConfigNames = new Set(fspConfigs.map((config) => config.name));
    const choiceNames = fspItem.choices.map((choice) => choice.name);

    // Check if all choices exist in FSP configs
    const invalidChoices = choiceNames.filter(
      (choice) => !fspConfigNames.has(choice),
    );

    if (invalidChoices.length > 0) {
      return {
        type: KoboValidationErrorType.invalidChoice,
        attributeName: fspQuestionName,
        error: `Attribute '${fspQuestionName}' has invalid choices: ${invalidChoices.join(', ')}`,
        solution: `Update choices to match FSP configuration names`,
        info: `Valid FSP configuration names: ${[...fspConfigNames].join(', ')}`,
      };
    }
    // There is no check to see if all FSP configs from the 121 program are represented in choices from kobo
    // Sometimes an fsp will only be set via the 121-platform and not be visible in Kobo, so we cannot enforce that all FSP configs are represented in the Kobo choices. We only check that if a choice is made in Kobo, it must be a valid FSP config.
  }

  private validateSelectOneHasChoices({
    koboSurveyItems,
  }: {
    koboSurveyItems: KoboSurveyItemCleaned[];
  }): KoboValidationError[] {
    return koboSurveyItems
      .filter((item) => item.type === 'select_one' && item.choices.length === 0)
      .map((item) => ({
        type: KoboValidationErrorType.selectOneNoChoices as const,
        attributeName: item.name,
        error: `'${item.name}' is of type select_one but has no choices defined`,
        solution:
          'Define choices directly in the Kobo form; external CSV choice files are not supported',
      }));
  }

  private collectErrors({
    accumulatedErrors,
    error,
  }: {
    accumulatedErrors: KoboValidationError[];
    error: KoboValidationError[] | KoboValidationError | undefined;
  }): KoboValidationError[] {
    if (!error) {
      return accumulatedErrors;
    }
    if (Array.isArray(error)) {
      return [...accumulatedErrors, ...error];
    } else {
      return [...accumulatedErrors, error];
    }
  }
}

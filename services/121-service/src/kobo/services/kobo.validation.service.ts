import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Equal } from 'typeorm';

import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { FINANCIAL_SERVICE_PROVIDER_ATTRIBUTE_TYPE_MAPPING } from '@121-service/src/fsp-management/fsp-attribute-type-mapping';
import { getFspAttributeNames } from '@121-service/src/fsp-management/fsp-settings.helpers';
import { KOBO_ALLOWED_REGISTRATION_VIEW_ATTRIBUTES } from '@121-service/src/kobo/consts/kobo-allowed-registration-view-attributes.const';
import { KOBO_TO_121_TYPE_MAPPING } from '@121-service/src/kobo/consts/kobo-survey-to-121-attribute-type.const';
import { KoboFormDefinition } from '@121-service/src/kobo/interfaces/kobo-form-definition.interface';
import { KoboSurveyItemCleaned } from '@121-service/src/kobo/interfaces/kobo-survey-item-cleaned.interface';
import {
  KoboValidationErrorBase,
  KoboValidationErrorType,
} from '@121-service/src/kobo/interfaces/kobo-validation-error.interface';
import { KoboLanguageMapper } from '@121-service/src/kobo/mappers/kobo-language.mapper';
import { fspQuestionName } from '@121-service/src/kobo/services/kobo.service';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { ProgramRepository } from '@121-service/src/programs/repositories/program.repository';
import {
  GenericRegistrationAttributes,
  RegistrationAttributeTypes,
} from '@121-service/src/registration/enum/registration-attribute.enum';
import {
  registrationViewAttributeNames,
  type RegistrationViewAttributeNameWithoutPhoneNumber,
} from '@121-service/src/shared/const';
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

  private throwErrorsIfAny(errors: KoboValidationErrorBase[]): void {
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
  }): KoboValidationErrorBase[] {
    const errors: KoboValidationErrorBase[] = [];

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
  }): KoboValidationErrorBase[] {
    const attributes = getFspAttributeNames(fspConfig.fspName);

    return attributes
      .filter(
        (attribute) => !koboSurveyItems.find((item) => item.name === attribute),
      )
      .map((attribute) => ({
        type: KoboValidationErrorType.MissingField as const,
        field: attribute,
        error: `Attribute '${attribute}' is missing`,
        solution: `Add '${attribute}' to the Kobo form (required for FSP '${fspConfig.name}')`,
        message: `Missing required attribute '${attribute}' (for FSP '${fspConfig.name}').`,
      }));
  }

  private validateFspAttributesTyping({
    koboSurveyItems,
    fspConfig,
  }: {
    koboSurveyItems: KoboSurveyItemCleaned[];
    fspConfig: { fspName: Fsps; name: string };
  }): KoboValidationErrorBase[] {
    const fspAttributeNames = getFspAttributeNames(fspConfig.fspName);

    return fspAttributeNames
      .map((fspAttributeName) =>
        this.validateSingleFspAttributeType({
          koboSurveyItems,
          fspAttributeName,
        }),
      )
      .filter((error): error is KoboValidationErrorBase => error !== undefined);
  }

  private validateSingleFspAttributeType({
    koboSurveyItems,
    fspAttributeName,
  }: {
    koboSurveyItems: KoboSurveyItemCleaned[];
    fspAttributeName: string;
  }): KoboValidationErrorBase | undefined {
    const surveyItem = koboSurveyItems.find(
      (item) => item.name === fspAttributeName,
    );

    // If the attribute is missing, the existence validation will have caught this and we can skip type validation
    if (!surveyItem) {
      return;
    }

    return this.validateSurveyItemTypeMatchExpected121Type({
      field: fspAttributeName,
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
  }): KoboValidationErrorBase[] {
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
      type: KoboValidationErrorType.MissingFullnameAttributes,
      field: missingAttribute,
      error: `Attribute '${missingAttribute}' is missing`,
      solution: `Add the missing attribute to the Kobo form`,
      message: `Kobo form must contain the following name attributes defined in program.fullnameNamingConvention. However the following attributes are missing: ${missingAttributes.join(', ')}`,
    }));
  }

  private validateFormHasEnglishLanguage({
    languages,
  }: {
    languages: (string | undefined)[];
  }): KoboValidationErrorBase | undefined {
    for (const language of languages) {
      const isoCode = KoboLanguageMapper.extractIsoCode({
        koboSurveyLanguage: language,
      });
      if (isoCode === RegistrationPreferredLanguage.en) {
        return;
      }
    }
    return {
      type: KoboValidationErrorType.MissingEnglishLanguage,
      field: 'languages',
      error: 'Form is missing English (en) as a language',
      solution: 'add English (en) as a language to the Kobo form', // <--- Lowercase on purpose, because we mash it together on the FE
      message: 'Kobo form must have English (en) as one of the languages.',
    };
  }

  // Phone number is a special case in validation as it part of the registration entity and not only a program registration attribute
  private validatePhoneNumberSurveyItem({
    koboSurveyItems,
    allowEmptyPhoneNumber,
  }: {
    koboSurveyItems: KoboSurveyItemCleaned[];
    allowEmptyPhoneNumber: boolean;
  }): KoboValidationErrorBase[] {
    const errors: KoboValidationErrorBase[] = [];

    const phoneNumberItem = koboSurveyItems.find(
      (item) => item.name === GenericRegistrationAttributes.phoneNumber,
    );

    // Only validate existence if empty phone numbers are not allowed
    if (!phoneNumberItem && !allowEmptyPhoneNumber) {
      errors.push({
        type: KoboValidationErrorType.MissingField,
        field: GenericRegistrationAttributes.phoneNumber,
        error: `Attribute '${GenericRegistrationAttributes.phoneNumber}' is missing`,
        solution:
          'Add a phoneNumber field with text type including country code, or set program.allowEmptyPhoneNumber to true',
        message: `Missing required attribute '${GenericRegistrationAttributes.phoneNumber}' (should be a text type and country code should be included, or program.allowEmptyPhoneNumber must be set to true).`,
      });
    }

    if (!phoneNumberItem) {
      return errors;
    }

    // Also validate type if the phone number item exists
    const error = this.validateSurveyItemTypeMatchExpected121Type({
      field: GenericRegistrationAttributes.phoneNumber,
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
  }): KoboValidationErrorBase | undefined {
    if (!scopeEnabled) {
      return;
    }
    const scopeItem = koboSurveyItems.find(
      (item) => item.name === GenericRegistrationAttributes.scope,
    );
    if (!scopeItem) {
      return {
        type: KoboValidationErrorType.MissingField,
        field: GenericRegistrationAttributes.scope,
        error: `Attribute '${GenericRegistrationAttributes.scope}' is missing`,
        solution:
          'Add a scope field to the Kobo form (required when program.enableScope is true)',
        message: `Missing required attribute '${GenericRegistrationAttributes.scope}' (required when program.enableScope is true).`,
      };
    }

    return this.validateSurveyItemTypeMatchExpected121Type({
      field: GenericRegistrationAttributes.scope,
      surveyItemType: scopeItem.type,
      expected121Type: RegistrationAttributeTypes.text,
    });
  }

  private validateNoMatrixType(
    koboSurveyItems: KoboSurveyItemCleaned[],
  ): KoboValidationErrorBase | undefined {
    const typeName = 'begin_kobomatrix';
    const matrixItem = koboSurveyItems.find((item) => item.type === typeName);
    if (matrixItem) {
      return {
        type: KoboValidationErrorType.MatrixTypeFound,
        field: matrixItem.name,
        error: `Form contains a matrix item: ${matrixItem.label?.join(', ')}`,
        solution: 'Remove the matrix item from the Kobo form',
        message: `Kobo form must not contain a matrix item. Found: ${matrixItem.label?.join(', ')}.`,
      };
    }
  }

  private validateKoboLanguageCodes({
    koboSurveyLanguages,
  }: {
    koboSurveyLanguages: (string | undefined)[];
  }): KoboValidationErrorBase[] {
    return koboSurveyLanguages
      .filter((language) => {
        const isoCode = KoboLanguageMapper.extractIsoCode({
          koboSurveyLanguage: language,
        });
        return !isoCode;
      })
      .map((language) => ({
        type: KoboValidationErrorType.InvalidLanguageCode as const,
        field: language ?? '-',
        error: `Invalid language code: '${language}'`,
        solution: 'use a valid ISO 639 language code.', // <--- Lowercase on purpose, because we mash it together on the FE
        info: `See https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes for valid codes`,
        message: `Invalid Kobo language code: ${language}. Please use https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes`,
      }));
  }

  private validateSurveyItemTypeMatchExpected121Type({
    field,
    surveyItemType,
    expected121Type,
  }: {
    field: string;
    surveyItemType: string;
    expected121Type: RegistrationAttributeTypes;
  }): KoboValidationErrorBase | undefined {
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
        type: KoboValidationErrorType.TypeMismatch,
        field,
        error: `Attribute '${field}' has incompatible type '${surveyItemType}'`,
        solution: `Change the field type to a accepted type`,
        info: `Expected one of: ${expectedKoboTypes.map((t) => `'${t}'`).join(', ')}`,
        message: `Attribute '${field}' has incompatible type, expected one of: ${expectedKoboTypes.map((t) => `'${t}'`).join(', ')}, got '${surveyItemType}'.`,
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
  }): KoboValidationErrorBase[] {
    return koboSurveyItems
      .filter((item) => registrationViewAttributeNames.includes(item.name))
      .filter((item) => item.name in KOBO_ALLOWED_REGISTRATION_VIEW_ATTRIBUTES)
      .map(({ name, type }) =>
        this.validateSurveyItemTypeMatchExpected121Type({
          field: name,
          surveyItemType: type,
          expected121Type: KOBO_ALLOWED_REGISTRATION_VIEW_ATTRIBUTES[name],
        }),
      )
      .filter((error): error is KoboValidationErrorBase => error !== undefined);
  }

  private validateForbiddenRegistrationViewAttributes({
    koboSurveyItems,
  }: {
    koboSurveyItems: KoboSurveyItemCleaned[];
  }): KoboValidationErrorBase[] {
    return koboSurveyItems
      .filter(
        (surveyItem) => surveyItem.name !== GenericRegistrationAttributes.scope,
      )
      .filter(
        (surveyItem) =>
          this.isRegistrationViewAttributeName(surveyItem.name) &&
          !KOBO_ALLOWED_REGISTRATION_VIEW_ATTRIBUTES[surveyItem.name],
      )
      .map((surveyItem) => ({
        type: KoboValidationErrorType.ForbiddenAttribute as const,
        field: surveyItem.name,
        error: `'${surveyItem.name}' is a reserved attribute name and cannot be filled from Kobo`,
        solution: `Rename the field '${surveyItem.name}' to a non-reserved name`,
        message: `Attribute '${surveyItem.name}' is a reserved attribute name and cannot be filled from Kobo.`,
      }));
  }

  private isRegistrationViewAttributeName(
    name: string,
  ): name is RegistrationViewAttributeNameWithoutPhoneNumber {
    return registrationViewAttributeNames.includes(name);
  }

  private validateFspQuestion({
    koboSurveyItems,
    fspConfigs,
  }: {
    koboSurveyItems: KoboSurveyItemCleaned[];
    fspConfigs: { fspName: Fsps; name: string }[];
  }): KoboValidationErrorBase | undefined {
    const fspItem = koboSurveyItems.find(
      (item) => item.name === fspQuestionName,
    );
    if (!fspItem) {
      return {
        type: KoboValidationErrorType.MissingField,
        field: fspQuestionName,
        error: `Attribute '${fspQuestionName}' is missing`,
        solution: `Add a field named '${fspQuestionName}' to the Kobo form`,
        message: `Missing required attribute '${fspQuestionName}'.`,
      };
    }

    const validTypes = new Set([
      ...KOBO_TYPES_ALLOWED_FOR_ANY_ATTRIBUTE,
      'select_one',
    ]);

    if (!validTypes.has(fspItem.type)) {
      return {
        type: KoboValidationErrorType.TypeMismatch,
        field: fspQuestionName,
        error: `Attribute '${fspQuestionName}' has incompatible type '${fspItem.type}'`,
        solution: `Change the field type to a accepted type`,
        info: `Expected one of: ${[...validTypes].map((t) => `'${t}'`).join(', ')}`,
        message: `Attribute '${fspQuestionName}' has incompatible type, expected one of: ${[...validTypes].map((t) => `'${t}'`).join(', ')}, got '${fspItem.type}'.`,
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
  }): KoboValidationErrorBase | undefined {
    const fspConfigNames = new Set(fspConfigs.map((config) => config.name));
    const choiceNames = fspItem.choices.map((choice) => choice.name);

    // Check if all choices exist in FSP configs
    const invalidChoices = choiceNames.filter(
      (choice) => !fspConfigNames.has(choice),
    );

    if (invalidChoices.length > 0) {
      return {
        type: KoboValidationErrorType.InvalidChoice,
        field: fspQuestionName,
        error: `Attribute '${fspQuestionName}' has invalid choices: ${invalidChoices.join(', ')}`,
        solution: `Update choices to match FSP configuration names`,
        info: `Valid FSP configuration names: ${[...fspConfigNames].join(', ')}`,
        message: `Attribute '${fspQuestionName}' has invalid choices: ${invalidChoices.join(', ')}. Expected one of: ${[...fspConfigNames].join(', ')}.`,
      };
    }
    // There is no check to see if all FSP configs from the 121 program are represented in choices from kobo
    // Sometimes an fsp will only be set via the 121-platform and not be visible in Kobo, so we cannot enforce that all FSP configs are represented in the Kobo choices. We only check that if a choice is made in Kobo, it must be a valid FSP config.
  }

  private validateSelectOneHasChoices({
    koboSurveyItems,
  }: {
    koboSurveyItems: KoboSurveyItemCleaned[];
  }): KoboValidationErrorBase[] {
    return koboSurveyItems
      .filter((item) => item.type === 'select_one' && item.choices.length === 0)
      .map((item) => ({
        type: KoboValidationErrorType.SelectOneNoChoices as const,
        field: item.name,
        error: `'${item.name}' is of type select_one but has no choices defined`,
        solution:
          'Define choices directly in the Kobo form; external CSV choice files are not supported',
        message: `Attribute '${item.name}' is of type select_one or select_one_from_file but has no choices defined. Note that choices defined in a separate CSV file are not supported.`,
      }));
  }

  private collectErrors({
    accumulatedErrors,
    error,
  }: {
    accumulatedErrors: KoboValidationErrorBase[];
    error: KoboValidationErrorBase[] | KoboValidationErrorBase | undefined;
  }): KoboValidationErrorBase[] {
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

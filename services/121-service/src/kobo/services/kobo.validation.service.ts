import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { isDefined } from 'class-validator';
import { Equal } from 'typeorm';

import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { FINANCIAL_SERVICE_PROVIDER_ATTRIBUTE_TYPE_MAPPING } from '@121-service/src/fsp-management/fsp-attribute-type-mapping';
import { getFspAttributeNames } from '@121-service/src/fsp-management/fsp-settings.helpers';
import { KOBO_ALLOWED_REGISTRATION_VIEW_ATTRIBUTES } from '@121-service/src/kobo/consts/kobo-allowed-registration-view-attributes.const';
import { KOBO_TO_121_TYPE_MAPPING } from '@121-service/src/kobo/consts/kobo-survey-to-121-attribute-type.const';
import { KoboFormDefinition } from '@121-service/src/kobo/interfaces/kobo-form-definition.interface';
import { KoboSurveyItemCleaned } from '@121-service/src/kobo/interfaces/kobo-survey-item-cleaned.interface';
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

    let errorMessages = this.validateFspAttributes({
      koboSurveyItems: formDefinition.survey,
      fspConfigs,
    });

    errorMessages = this.collectErrors({
      accumulatedErrors: errorMessages,
      error: this.validateFormHasEnglishLanguage({
        languages: formDefinition.languages,
      }),
    });

    errorMessages = this.collectErrors({
      accumulatedErrors: errorMessages,
      error: this.validateFullNameNamingConventionInKoboSurveyItems({
        koboSurveyItems: formDefinition.survey,
        fullnameNamingConvention: program.fullnameNamingConvention ?? [],
      }),
    });

    errorMessages = this.collectErrors({
      accumulatedErrors: errorMessages,
      error: this.validatePhoneNumberSurveyItem({
        koboSurveyItems: formDefinition.survey,
        allowEmptyPhoneNumber: program.allowEmptyPhoneNumber,
      }),
    });

    errorMessages = this.collectErrors({
      accumulatedErrors: errorMessages,
      error: this.validateScopeInKoboSurveyItems({
        koboSurveyItems: formDefinition.survey,
        scopeEnabled: program.enableScope,
      }),
    });

    errorMessages = this.collectErrors({
      accumulatedErrors: errorMessages,
      error: this.validateNoMatrixType(formDefinition.survey),
    });

    errorMessages = this.collectErrors({
      accumulatedErrors: errorMessages,
      error: this.validateKoboLanguageCodes({
        koboSurveyLanguages: formDefinition.languages,
      }),
    });

    errorMessages = this.collectErrors({
      accumulatedErrors: errorMessages,
      error: this.validateAllowedRegistrationViewAttributeTypes({
        koboSurveyItems: formDefinition.survey,
      }),
    });

    errorMessages = this.collectErrors({
      accumulatedErrors: errorMessages,
      error: this.validateForbiddenRegistrationViewAttributes({
        koboSurveyItems: formDefinition.survey,
      }),
    });

    errorMessages = this.collectErrors({
      accumulatedErrors: errorMessages,
      error: this.validateFspQuestion({
        koboSurveyItems: formDefinition.survey,
        fspConfigs,
      }),
    });

    this.throwErrorsIfAny(errorMessages);
  }

  private throwErrorsIfAny(errorMessages: string[]): void {
    if (errorMessages.length > 0) {
      throw new HttpException(
        `Kobo form definition validation failed:\n- ${errorMessages.join(
          '\n- ',
        )}`,
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
  }): string[] {
    const errorMessages: string[] = [];

    for (const fspConfig of fspConfigs) {
      const fspAttributeExistErrorMessages =
        this.validateFspAttributesExistInForm({
          koboSurveyItems,
          fspConfig,
        });
      const fspAttributeTypingErrorMessages = this.validateFspAttributesTyping({
        koboSurveyItems,
        fspConfig,
      });

      errorMessages.push(...fspAttributeTypingErrorMessages);
      errorMessages.push(...fspAttributeExistErrorMessages);
    }

    return errorMessages;
  }

  private validateFspAttributesExistInForm({
    koboSurveyItems,
    fspConfig,
  }: {
    koboSurveyItems: KoboSurveyItemCleaned[];
    fspConfig: { fspName: Fsps; name: string };
  }): string[] {
    const errorMessages: string[] = [];
    const attributes = getFspAttributeNames(fspConfig.fspName);

    for (const attribute of attributes) {
      const attributeInKobo = koboSurveyItems.find(
        (item) => item.name === attribute,
      );
      if (!attributeInKobo) {
        errorMessages.push(
          `Missing required FSP attribute '${attribute}' for FSP '${fspConfig.name}' in Kobo asset survey.`,
        );
      }
    }

    return errorMessages;
  }

  private validateFspAttributesTyping({
    koboSurveyItems,
    fspConfig,
  }: {
    koboSurveyItems: KoboSurveyItemCleaned[];
    fspConfig: { fspName: Fsps; name: string };
  }): string[] {
    const errorMessages: string[] = [];
    const fspAttributeNames = getFspAttributeNames(fspConfig.fspName);

    for (const fspAttributeName of fspAttributeNames) {
      const errorMessage = this.validateSingleFspAttributeType({
        koboSurveyItems,
        fspAttributeName,
      });

      if (errorMessage) {
        errorMessages.push(errorMessage);
      }
    }

    return errorMessages;
  }

  private validateSingleFspAttributeType({
    koboSurveyItems,
    fspAttributeName,
  }: {
    koboSurveyItems: KoboSurveyItemCleaned[];
    fspAttributeName: string;
  }): string | undefined {
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
  }): string[] {
    const errors: string[] = [];
    const koboAttributesNames = koboSurveyItems.map((item) => item.name);

    const missingAttributes = fullnameNamingConvention.filter(
      (attr) => !koboAttributesNames.includes(attr),
    );
    if (missingAttributes.length > 0) {
      errors.push(
        `Kobo form must contain the following name attributes defined in program.fullnameNamingConvention. However the following attributes are missing: ${missingAttributes.join(
          ', ',
        )}`,
      );
    }

    return errors;
  }

  private validateFormHasEnglishLanguage({
    languages,
  }: {
    languages: (string | undefined)[];
  }): string | undefined {
    for (const language of languages) {
      const isoCode = KoboLanguageMapper.extractIsoCode({
        koboSurveyLanguage: language,
      });
      if (isoCode === RegistrationPreferredLanguage.en) {
        return;
      }
    }
    return 'Kobo form must have English (en) as one of the languages.';
  }

  // Phone number is a special case in validation as it part of the registration entity and not only a program registration attribute
  private validatePhoneNumberSurveyItem({
    koboSurveyItems,
    allowEmptyPhoneNumber,
  }: {
    koboSurveyItems: KoboSurveyItemCleaned[];
    allowEmptyPhoneNumber: boolean;
  }): string[] {
    const errors: string[] = [];

    const phoneNumberItem = koboSurveyItems.find(
      (item) => item.name === GenericRegistrationAttributes.phoneNumber,
    );

    // Only validate existence if empty phone numbers are not allowed
    if (!phoneNumberItem && !allowEmptyPhoneNumber) {
      errors.push(
        'Kobo form must contain a question with name phoneNumber (should be a text type and country code should be included) or program.allowEmptyPhoneNumber must be set to true.',
      );
    }

    if (!phoneNumberItem) {
      return errors;
    }

    // Also validate type if the phone number item exists

    const error = this.validateSurveyItemTypeMatchExpected121Type({
      attributeName: GenericRegistrationAttributes.phoneNumber,
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
  }): string | undefined {
    if (!scopeEnabled) {
      return;
    }
    const scopeItem = koboSurveyItems.find(
      (item) => item.name === GenericRegistrationAttributes.scope,
    );
    if (!scopeItem) {
      return 'Kobo form must contain a scope item if program.enableScope is set to true.';
    }
    const scopeItemType = scopeItem.type;
    const error = this.validateSurveyItemTypeMatchExpected121Type({
      attributeName: GenericRegistrationAttributes.scope,
      surveyItemType: scopeItemType,
      expected121Type: RegistrationAttributeTypes.text,
    });
    if (error) {
      return error;
    }
  }

  private validateNoMatrixType(
    koboSurveyItems: KoboSurveyItemCleaned[],
  ): string | undefined {
    const typeName = 'begin_kobomatrix';
    const matrixItem = koboSurveyItems.find((item) => item.type === typeName);
    if (matrixItem) {
      return `Kobo form must not contain a matrix item. Found: ${JSON.stringify(
        matrixItem.label,
      )}`;
    }
  }

  private validateKoboLanguageCodes({
    koboSurveyLanguages,
  }: {
    koboSurveyLanguages: (string | undefined)[];
  }): string[] {
    const errorMessages: string[] = [];
    for (const language of koboSurveyLanguages) {
      const isoLanguageCode = KoboLanguageMapper.extractIsoCode({
        koboSurveyLanguage: language,
      });
      if (!isoLanguageCode) {
        errorMessages.push(
          `Invalid Kobo language code: ${language}. Please use https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes`,
        );
      }
    }
    return errorMessages;
  }

  private validateSurveyItemTypeMatchExpected121Type({
    attributeName,
    surveyItemType,
    expected121Type,
  }: {
    attributeName: string;
    surveyItemType: string;
    expected121Type: RegistrationAttributeTypes;
  }): string | undefined {
    // Hidden fields are allowed for any attribute type as they are now used by our cash-im team for any values
    if (surveyItemType === 'hidden') {
      return;
    }

    const expectedKoboTypes = this.getKoboTypesFrom121Type(expected121Type);
    // There is no direct mapping for tel to Kobo types, so we use text as acceptable type
    if (expected121Type === RegistrationAttributeTypes.tel) {
      expectedKoboTypes.push('text');
    }

    if (!expectedKoboTypes.includes(surveyItemType)) {
      return `Kobo form attribute "${attributeName}" has incompatible type for 121 attribute, expected one of the following types: "${expectedKoboTypes.join(', ')}", got "${surveyItemType}"  `;
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
  }): string[] {
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
  }): string[] {
    const errorMessages: string[] = [];

    for (const surveyItem of koboSurveyItems) {
      // Scope has its own validation logic, so skip it here
      if (surveyItem.name === GenericRegistrationAttributes.scope) {
        continue;
      }

      // Type-safe check: if the name is a registration view attribute
      if (
        this.isRegistrationViewAttributeName(surveyItem.name) &&
        !KOBO_ALLOWED_REGISTRATION_VIEW_ATTRIBUTES[surveyItem.name]
      ) {
        errorMessages.push(
          `Kobo form attribute "${surveyItem.name}" is a reserved attribute name cannot be filled from Kobo.`,
        );
      }
    }

    return errorMessages;
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
  }): string | undefined {
    const fspItem = koboSurveyItems.find(
      (item) => item.name === fspQuestionName,
    );
    if (!fspItem) {
      return `Kobo form must contain a question with name "${fspQuestionName}".`;
    }

    const validTypes = ['hidden', 'select_one', 'calculate'];
    const isValidType =
      validTypes.includes(fspItem.type) ||
      fspItem.type.startsWith('select_one ');

    if (!isValidType) {
      return `Kobo form attribute "${fspQuestionName}" must be of type "hidden" or "select_one" (dropdown), got "${fspItem.type}".`;
    }

    // If it's a select_one, validate that the choices match the FSP configuration names
    if (fspItem.type.includes('select_one') && fspItem.choices.length > 0) {
      return this.validateFspQuestionChoices({
        fspItem,
        fspConfigs,
      });
    }
  }

  private validateFspQuestionChoices({
    fspItem,
    fspConfigs,
  }: {
    fspItem: KoboSurveyItemCleaned;
    fspConfigs: { fspName: Fsps; name: string }[];
  }): string | undefined {
    const fspConfigNames = fspConfigs.map((config) => config.name);
    const choiceNames = fspItem.choices.map((choice) => choice.name);

    // Check if all choices exist in FSP configs
    const invalidChoices = choiceNames.filter(
      (choice) => !fspConfigNames.includes(choice),
    );

    if (invalidChoices.length > 0) {
      return `Kobo form attribute "${fspQuestionName}" has choices that don't match program FSP configuration names. Invalid choices: ${invalidChoices.join(', ')}. Expected one of: ${fspConfigNames.join(', ')}.`;
    }
    // There is no check if to see if all FSP configs from the 121 program are represented in choices from kobo
    // Sometimes an fsp will only be set via the 121-platform and not be visible in Kobo, so we cannot enforce that all FSP configs are represented in the Kobo choices. We only check that if a choice is made in Kobo, it must be a valid FSP config.
  }

  private collectErrors({
    accumulatedErrors,
    error,
  }: {
    accumulatedErrors: string[];
    error: string[] | string | undefined;
  }): string[] {
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

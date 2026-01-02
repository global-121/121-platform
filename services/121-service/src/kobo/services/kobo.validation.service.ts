import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Equal } from 'typeorm';

import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { FINANCIAL_SERVICE_PROVIDER_ATTRIBUTE_TYPE_MAPPING } from '@121-service/src/fsp-management/fsp-attribute-type-mapping';
import { getFspAttributeNames } from '@121-service/src/fsp-management/fsp-settings.helpers';
import { KOBO_TO_121_TYPE_MAPPING } from '@121-service/src/kobo/consts/kobo-survey-to-121-attribute-type.const';
import { KoboFormDefinition } from '@121-service/src/kobo/interfaces/kobo-form-definition.interface';
import { KoboSurveyItemCleaned } from '@121-service/src/kobo/interfaces/kobo-survey-item-cleaned.interface';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { ProgramRepository } from '@121-service/src/programs/repositories/program.repository';
import {
  GenericRegistrationAttributes,
  RegistrationAttributeTypes,
} from '@121-service/src/registration/enum/registration-attribute.enum';
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
    // Fetch program properties once at the beginning
    const program = await this.programRepository.findOneOrFail({
      where: { id: Equal(programId) },
      select: {
        fullnameNamingConvention: true,
        allowEmptyPhoneNumber: true,
        enableScope: true,
      },
    });

    const errorMessages = await this.validateFspAttributes({
      koboSurveyItems: formDefinition.survey,
      programId,
    });

    const englishLanguageErrorMessage = this.validateFormHasEnglishLanguage({
      languages: formDefinition.languages,
    });
    if (englishLanguageErrorMessage) {
      errorMessages.push(englishLanguageErrorMessage);
    }

    const errorsFullnameConvention =
      this.validateFullNameNamingConventionInKoboSurveyItems({
        koboSurveyItems: formDefinition.survey,
        fullnameNamingConvention: program.fullnameNamingConvention ?? [],
      });
    errorMessages.push(...errorsFullnameConvention);

    const phoneNumberErrors = this.validatePhoneNumberSurveyItem({
      koboSurveyItems: formDefinition.survey,
      allowEmptyPhoneNumber: program.allowEmptyPhoneNumber,
    });
    errorMessages.push(...phoneNumberErrors);

    const scopeError = this.validateScopeInKoboSurveyItems({
      koboSurveyItems: formDefinition.survey,
      scopeEnabled: program.enableScope,
    });
    if (scopeError) {
      errorMessages.push(scopeError);
    }

    const matrixTypeError = this.validateNoMatrixType(formDefinition.survey);
    if (matrixTypeError) {
      errorMessages.push(matrixTypeError);
    }

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

  private async validateFspAttributes({
    koboSurveyItems,
    programId,
  }: {
    koboSurveyItems: KoboSurveyItemCleaned[];
    programId: number;
  }): Promise<string[]> {
    const errorMessages: string[] = [];
    const fspConfigs = await this.programFspConfigurationRepository.find({
      where: { programId: Equal(programId) },
      select: {
        fspName: true,
        name: true,
      },
    });

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
      const surveyItem = koboSurveyItems.find(
        (item) => item.name === fspAttributeName,
      );

      // If the attribute is missing, the existence validation will have caught this and we can skip type validation
      if (surveyItem) {
        const surveyItemKoboType = surveyItem.type;
        const errorMessage = this.validateSurveyItemTypeMatchExpected121Type({
          attributeName: fspAttributeName,
          surveyItemType: surveyItemKoboType,
          expected121Type:
            FINANCIAL_SERVICE_PROVIDER_ATTRIBUTE_TYPE_MAPPING[fspAttributeName],
        });

        if (errorMessage) {
          errorMessages.push(errorMessage);
        }
      }
    }
    return errorMessages;
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

  private validateSurveyItemTypeMatchExpected121Type({
    attributeName,
    surveyItemType,
    expected121Type,
  }: {
    attributeName: string;
    surveyItemType: string;
    expected121Type: RegistrationAttributeTypes;
  }): string | undefined {
    const expectedKoboTypes = this.getKoboTypesFrom121Type(expected121Type);
    if (expected121Type === RegistrationAttributeTypes.tel) {
      expectedKoboTypes.push('text');
    }

    if (expectedKoboTypes.includes(surveyItemType)) {
      return;
    } else {
      return `Kobo form attribute "${attributeName}" has incompatible type for 121 attribute: expected: "${expectedKoboTypes.join(', ')}", got "${surveyItemType}"  `;
    }
  }

  private getKoboTypesFrom121Type(type: string): string[] {
    return Object.entries(KOBO_TO_121_TYPE_MAPPING)
      .filter(([_, value]) => value === type)
      .map(([key]) => key);
  }

  private validateFormHasEnglishLanguage({
    languages,
  }: {
    languages: string[];
  }): string | undefined {
    for (const language of languages) {
      if (language.includes(`(${RegistrationPreferredLanguage.en})`)) {
        return;
      }
    }
    return 'Kobo form must have English (en) as one of the languages.';
  }

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

    // Also validate type if the phone number item exists
    if (phoneNumberItem) {
      const error = this.validateSurveyItemTypeMatchExpected121Type({
        attributeName: GenericRegistrationAttributes.phoneNumber,
        surveyItemType: phoneNumberItem.type,
        expected121Type: RegistrationAttributeTypes.tel,
      });
      if (error) {
        errors.push(error);
      }
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
}

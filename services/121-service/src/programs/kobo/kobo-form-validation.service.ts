import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import { FinancialServiceProviderAttributes } from '@121-service/src/financial-service-providers/enum/financial-service-provider-attributes.enum';
import { FinancialServiceProviders } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { FINANCIAL_SERVICE_PROVIDER_ATTRIBUTE_TYPE_MAPPING } from '@121-service/src/financial-service-providers/financial-service-provider-attributes-type-mapping.const';
import { getFinancialServiceProviderSettingByNameOrThrow } from '@121-service/src/financial-service-providers/financial-service-provider-settings.helpers';
import { getCleanAttributeNameFromKoboSurveyItem } from '@121-service/src/programs/kobo/helpers/clean-kobo-survey-names';
import { KoboSurveyItem } from '@121-service/src/programs/kobo/interfaces/kobo-survey-item.interface';
import { KoboFormResponse } from '@121-service/src/programs/kobo/kobo-api-service';
import { getKoboTypesFrom121Type } from '@121-service/src/programs/kobo/kobo-to-121-type-mapping.const';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import {
  GenericRegistrationAttributes,
  RegistrationAttributeTypes,
} from '@121-service/src/registration/enum/registration-attribute.enum';

@Injectable()
export class KoboFormValidationService {
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;

  public async validateKoboForm({
    programId,
    koboInformation,
  }: {
    programId: number;
    koboInformation: KoboFormResponse;
  }): Promise<void> {
    const programEntity = await this.programRepository.findOneOrFail({
      where: {
        id: Equal(programId),
      },
      relations: ['programFinancialServiceProviderConfigurations'],
    });

    // Collect all errors from all validation methods
    const allErrors: string[] = [];

    // FSP validation
    const fspErrors = this.validateFinancialServiceProviderSurveyItems(
      koboInformation.survey,
      programEntity.programFinancialServiceProviderConfigurations.map(
        (configuration) => configuration.financialServiceProviderName,
      ),
    );
    allErrors.push(...fspErrors);

    // Phone number validation (if required)
    if (!programEntity.allowEmptyPhoneNumber) {
      const phoneErrors = this.validatePhoneNumberSurveyItem(
        koboInformation.survey,
      );
      allErrors.push(...phoneErrors);
    }

    // Fullname convention validation (if configured)
    const fullnameNamingConvention = programEntity.fullnameNamingConvention;
    if (fullnameNamingConvention) {
      const fullnameErrors =
        this.validateFullNameNamingConventionInKoboSurveyItems(
          koboInformation.survey,
          fullnameNamingConvention,
        );
      allErrors.push(...fullnameErrors);
    }

    if (programEntity.enableScope) {
      const scopeError = this.validateScopeInKoboSurveyItems(
        koboInformation.survey,
      );
      if (scopeError) {
        allErrors.push(scopeError);
      }
    }

    // Validate supported field types
    const matrixTypeError = this.validateNoMatrixType(koboInformation.survey);
    if (matrixTypeError) {
      allErrors.push(matrixTypeError);
    }

    // If any errors were collected, throw them all at once
    if (allErrors.length > 0) {
      throw new HttpException(allErrors, HttpStatus.BAD_REQUEST);
    }
  }

  private validateNoMatrixType(
    koboSurveyItems: KoboSurveyItem[],
  ): string | undefined {
    const typeName = 'begin_kobomatrix';
    const matrixItem = koboSurveyItems.find((item) => item.type === typeName);
    if (matrixItem) {
      return `Kobo form must not contain a matrix item. Found: ${JSON.stringify(
        matrixItem.label,
      )}`;
    }
  }

  private validateScopeInKoboSurveyItems(
    koboSurveyItems: KoboSurveyItem[],
  ): string | undefined {
    const scopeItem = koboSurveyItems.find(
      (item) =>
        getCleanAttributeNameFromKoboSurveyItem(item) ===
        GenericRegistrationAttributes.scope,
    );
    if (!scopeItem) {
      return 'Kobo form must contain a scope item';
    }
    const scopeItemType = scopeItem.type;
    const expectedTypes = getKoboTypesFrom121Type(
      RegistrationAttributeTypes.text,
    );
    if (!expectedTypes.includes(scopeItemType)) {
      return `Kobo form scope item must be of type "${expectedTypes.join(
        ', ',
      )}", but got "${scopeItemType}"`;
    }
  }

  private validateFullNameNamingConventionInKoboSurveyItems(
    koboSurveyItems: KoboSurveyItem[],
    fullnameNamingConvention: string[],
  ): string[] {
    const errors: string[] = [];
    const koboAttributes = koboSurveyItems.map((item) =>
      getCleanAttributeNameFromKoboSurveyItem(item),
    );

    const missingAttributes = fullnameNamingConvention.filter(
      (attr) => !koboAttributes.includes(attr),
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

  private validatePhoneNumberSurveyItem(
    koboSurveyItems: KoboSurveyItem[],
  ): string[] {
    const errors: string[] = [];
    const koboAttributes = koboSurveyItems.map((item) =>
      getCleanAttributeNameFromKoboSurveyItem(item),
    );

    const phoneNumberItem = koboAttributes.find(
      (item) => item === GenericRegistrationAttributes.phoneNumber,
    );

    if (!phoneNumberItem) {
      errors.push('Kobo form must contain a phone number item');
    }
    console.log('🚀 ~ KoboFormValidationService ~ errors:', errors);

    return errors;
  }

  private validateFinancialServiceProviderSurveyItems(
    koboSurveyItems: KoboSurveyItem[],
    financialServiceProviderNames: FinancialServiceProviders[],
  ): string[] {
    const koboAttributes = koboSurveyItems.map((item) =>
      getCleanAttributeNameFromKoboSurveyItem(item),
    );

    const errors: string[] = [];

    // Check each FSP separately
    for (const name of financialServiceProviderNames) {
      const fsp = getFinancialServiceProviderSettingByNameOrThrow(name);
      const fspAttributes = fsp.attributes.map((a) => a.name);

      const missingAttributes = fspAttributes.filter(
        (attr) => !koboAttributes.includes(attr),
      );

      if (missingAttributes.length > 0) {
        errors.push(
          `FSP "${name}" required attributes that are missing from the Kobo form: ${missingAttributes.join(', ')}`,
        );
      }
      const fspAttributeTypeErrors = this.validateAttributeTypeCompatibility(
        koboSurveyItems,
        fspAttributes,
        name,
      );
      errors.push(...fspAttributeTypeErrors);
    }

    return errors;
  }

  private validateAttributeTypeCompatibility(
    koboSurveyItems: KoboSurveyItem[],
    expectFspAttributes: FinancialServiceProviderAttributes[],
    fspName: FinancialServiceProviders,
  ): string[] {
    const errors: string[] = [];
    for (const fspAttribute of expectFspAttributes) {
      const koboItem = koboSurveyItems.find(
        (item) => item.name === fspAttribute,
      );

      if (koboItem) {
        const surveyItemKoboType = koboItem.type;

        const expectedTypeForFspAttribute =
          FINANCIAL_SERVICE_PROVIDER_ATTRIBUTE_TYPE_MAPPING[fspAttribute];

        const expectedSurveyKoboTypes = getKoboTypesFrom121Type(
          expectedTypeForFspAttribute,
        );

        if (
          !(
            expectedSurveyKoboTypes.includes(surveyItemKoboType) ||
            surveyItemKoboType === ''
          )
        ) {
          errors.push(
            `Kobo form attribute "${fspAttribute}" has incompatible type for FSP integration '${fspName}': expected one of these: "${expectedSurveyKoboTypes.join(', ')}", got "${surveyItemKoboType}"`,
          );
        }
      }
    }
    return errors;
  }
}

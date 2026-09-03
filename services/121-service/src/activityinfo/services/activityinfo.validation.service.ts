import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { isDefined } from 'class-validator';
import { Equal } from 'typeorm';

import { ACTIVITY_INFO_ALLOWED_REGISTRATION_VIEW_ATTRIBUTES } from '@121-service/src/activityinfo/consts/activityinfo-allowed-registration-view-attributes.const';
import { fspFieldCode } from '@121-service/src/activityinfo/consts/activityinfo-fsp-field.const';
import {
  ActivityInfoEnumeratedCardinality,
  ActivityInfoFieldType,
} from '@121-service/src/activityinfo/enum/activityinfo-field-type';
import { ActivityInfoValidationErrorType } from '@121-service/src/activityinfo/enum/activityinfo-validation-error-type';
import {
  getActivityInfoTypesFor121Type,
  resolveAttributeTypeForActivityInfoField,
} from '@121-service/src/activityinfo/helpers/activityinfo-attribute-type.helper';
import { ActivityInfoFieldCleaned } from '@121-service/src/activityinfo/interfaces/activityinfo-field-cleaned.interface';
import { ActivityInfoFormDefinition } from '@121-service/src/activityinfo/interfaces/activityinfo-form-definition.interface';
import { ActivityInfoValidationError } from '@121-service/src/activityinfo/interfaces/activityinfo-validation-error.interface';
import { getOptionValueForChoice } from '@121-service/src/activityinfo/mappers/activityinfo-record.mapper';
import { env } from '@121-service/src/env';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { FINANCIAL_SERVICE_PROVIDER_ATTRIBUTE_TYPE_MAPPING } from '@121-service/src/fsp-management/fsp-attribute-type-mapping';
import { getFspAttributeNames } from '@121-service/src/fsp-management/fsp-settings.helpers';
import { TwilioMode } from '@121-service/src/notifications/enum/twilio-mode.enum';
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

// Calculated fields are accepted for any 121 attribute type, because they are
// used to derive or pre-fill values whose resulting type cannot be checked from
// the schema alone. This mirrors how 'hidden' and 'calculate' are treated for Kobo.
const ACTIVITY_INFO_TYPES_ALLOWED_FOR_ANY_ATTRIBUTE = [
  ActivityInfoFieldType.calculated,
] as const;

@Injectable()
export class ActivityInfoValidationService {
  constructor(
    private readonly programRepository: ProgramRepository,
    private readonly programFspConfigurationRepository: ProgramFspConfigurationRepository,
  ) {}

  public async validateActivityInfoFormDefinition({
    formDefinition,
    programId,
  }: {
    formDefinition: ActivityInfoFormDefinition;
    programId: number;
  }): Promise<void> {
    const program = await this.programRepository.findOneOrFail({
      where: { id: Equal(programId) },
      select: {
        fullnameNamingConvention: true,
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

    const { fields } = formDefinition;

    let errors = this.validateFspAttributes({ fields, fspConfigs });

    errors = this.collectErrors({
      accumulatedErrors: errors,
      error: this.validateFormLanguageIsEnglish({
        language: formDefinition.language,
      }),
    });

    errors = this.collectErrors({
      accumulatedErrors: errors,
      error: this.validateMappableFieldsHaveCode({ fields }),
    });

    errors = this.collectErrors({
      accumulatedErrors: errors,
      error: this.validateFieldCodesAreUnique({ fields }),
    });

    errors = this.collectErrors({
      accumulatedErrors: errors,
      error: this.validateFullNameNamingConvention({
        fields,
        fullnameNamingConvention: program.fullnameNamingConvention ?? [],
      }),
    });

    errors = this.collectErrors({
      accumulatedErrors: errors,
      error: this.validatePhoneNumberField({ fields }),
    });

    errors = this.collectErrors({
      accumulatedErrors: errors,
      error: this.validateScopeField({
        fields,
        scopeEnabled: program.enableScope,
      }),
    });

    errors = this.collectErrors({
      accumulatedErrors: errors,
      error: this.validateNoSubForm({ fields }),
    });

    errors = this.collectErrors({
      accumulatedErrors: errors,
      error: this.validateAllowedRegistrationViewAttributeTypes({ fields }),
    });

    errors = this.collectErrors({
      accumulatedErrors: errors,
      error: this.validateForbiddenRegistrationViewAttributes({ fields }),
    });

    errors = this.collectErrors({
      accumulatedErrors: errors,
      error: this.validateFspField({ fields, fspConfigs }),
    });

    errors = this.collectErrors({
      accumulatedErrors: errors,
      error: this.validateSingleSelectHasChoices({ fields }),
    });

    this.throwErrorsIfAny(errors);
  }

  private throwErrorsIfAny(errors: ActivityInfoValidationError[]): void {
    if (errors.length > 0) {
      throw new HttpException(
        {
          message: 'ActivityInfo form definition validation failed',
          errors,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private validateFspAttributes({
    fields,
    fspConfigs,
  }: {
    fields: ActivityInfoFieldCleaned[];
    fspConfigs: { fspName: Fsps; name: string }[];
  }): ActivityInfoValidationError[] {
    const errors: ActivityInfoValidationError[] = [];

    for (const fspConfig of fspConfigs) {
      errors.push(...this.validateFspAttributesExistInForm({ fields, fspConfig }));
      errors.push(...this.validateFspAttributesTyping({ fields, fspConfig }));
    }

    return errors;
  }

  private validateFspAttributesExistInForm({
    fields,
    fspConfig,
  }: {
    fields: ActivityInfoFieldCleaned[];
    fspConfig: { fspName: Fsps; name: string };
  }): ActivityInfoValidationError[] {
    const attributeNames = getFspAttributeNames(fspConfig.fspName);

    return attributeNames
      .filter((attributeName) => !this.findFieldByCode({ fields, code: attributeName }))
      .map((attributeName) => ({
        type: ActivityInfoValidationErrorType.missingField as const,
        attributeName,
        error: `Attribute '${attributeName}' is missing`,
        solution: `Add a field with the code '${attributeName}' to the ActivityInfo form`,
      }));
  }

  private validateFspAttributesTyping({
    fields,
    fspConfig,
  }: {
    fields: ActivityInfoFieldCleaned[];
    fspConfig: { fspName: Fsps; name: string };
  }): ActivityInfoValidationError[] {
    const errors: ActivityInfoValidationError[] = [];

    for (const attributeName of getFspAttributeNames(fspConfig.fspName)) {
      const field = this.findFieldByCode({ fields, code: attributeName });

      // A missing attribute is already reported by the existence validation.
      if (!field) {
        continue;
      }

      const error = this.validateFieldTypeMatchesExpected121Type({
        attributeName,
        field,
        expected121Type:
          FINANCIAL_SERVICE_PROVIDER_ATTRIBUTE_TYPE_MAPPING[attributeName],
      });

      if (error) {
        errors.push(error);
      }
    }

    return errors;
  }

  private validateFormLanguageIsEnglish({
    language,
  }: {
    language: string | undefined;
  }): ActivityInfoValidationError | undefined {
    // An ActivityInfo form does not have to declare a language. When it does
    // not, its labels are assumed to be English.
    if (!language) {
      return;
    }

    if (language.toLowerCase().startsWith(RegistrationPreferredLanguage.en)) {
      return;
    }

    return {
      type: ActivityInfoValidationErrorType.unsupportedLanguage,
      attributeName: 'language',
      error: `Form language '${language}' is not English (en)`,
      solution:
        'Set the ActivityInfo form language to English (en), because 121 requires English labels.',
    };
  }

  private validateMappableFieldsHaveCode({
    fields,
  }: {
    fields: ActivityInfoFieldCleaned[];
  }): ActivityInfoValidationError[] {
    return fields
      .filter((field) => resolveAttributeTypeForActivityInfoField({ field }))
      .filter((field) => !field.code)
      .map((field) => ({
        type: ActivityInfoValidationErrorType.missingFieldCode as const,
        attributeName: field.label || field.id,
        error: `Field '${field.label || field.id}' has no code`,
        solution:
          'Give every field a code in ActivityInfo, because 121 uses the code to name the registration attribute',
      }));
  }

  private validateFieldCodesAreUnique({
    fields,
  }: {
    fields: ActivityInfoFieldCleaned[];
  }): ActivityInfoValidationError[] {
    const seenCodes = new Set<string>();
    const duplicateCodes = new Set<string>();

    for (const field of fields) {
      if (!field.code) {
        continue;
      }
      if (seenCodes.has(field.code)) {
        duplicateCodes.add(field.code);
      }
      seenCodes.add(field.code);
    }

    return [...duplicateCodes].map((code) => ({
      type: ActivityInfoValidationErrorType.invalidChoice as const,
      attributeName: code,
      error: `Multiple fields share the code '${code}'`,
      solution:
        'Give each field a unique code, because 121 stores one registration attribute per code',
    }));
  }

  private validateFullNameNamingConvention({
    fields,
    fullnameNamingConvention,
  }: {
    fields: ActivityInfoFieldCleaned[];
    fullnameNamingConvention: string[];
  }): ActivityInfoValidationError[] {
    return fullnameNamingConvention
      .filter((attributeName) => !this.findFieldByCode({ fields, code: attributeName }))
      .map((attributeName) => ({
        type: ActivityInfoValidationErrorType.missingFullnameAttributes as const,
        attributeName,
        error: `Attribute '${attributeName}' is missing`,
        solution: 'Add the missing field to the ActivityInfo form',
      }));
  }

  private validatePhoneNumberField({
    fields,
  }: {
    fields: ActivityInfoFieldCleaned[];
  }): ActivityInfoValidationError[] {
    const errors: ActivityInfoValidationError[] = [];
    const { phoneNumber } = DefaultRegistrationDataAttributeNames;

    const phoneNumberField = this.findFieldByCode({ fields, code: phoneNumber });

    if (!phoneNumberField && env.TWILIO_MODE !== TwilioMode.disabled) {
      errors.push({
        type: ActivityInfoValidationErrorType.missingField,
        attributeName: phoneNumber,
        error: `Attribute '${phoneNumber}' is missing`,
        solution:
          'Add a field with the code phoneNumber of type FREE_TEXT including country code, or contact 121 support to disable Twilio for this instance',
      });
    }

    if (!phoneNumberField) {
      return errors;
    }

    const error = this.validateFieldTypeMatchesExpected121Type({
      attributeName: phoneNumber,
      field: phoneNumberField,
      expected121Type: RegistrationAttributeTypes.tel,
    });

    if (error) {
      errors.push(error);
    }

    return errors;
  }

  private validateScopeField({
    fields,
    scopeEnabled,
  }: {
    fields: ActivityInfoFieldCleaned[];
    scopeEnabled: boolean;
  }): ActivityInfoValidationError | undefined {
    if (!scopeEnabled) {
      return;
    }

    const { scope } = GenericRegistrationAttributes;
    const scopeField = this.findFieldByCode({ fields, code: scope });

    if (!scopeField) {
      return {
        type: ActivityInfoValidationErrorType.missingField,
        attributeName: scope,
        error: `Attribute '${scope}' is missing`,
        solution:
          'Add a field with the code scope to the ActivityInfo form (required when program.enableScope is true)',
      };
    }

    return this.validateFieldTypeMatchesExpected121Type({
      attributeName: scope,
      field: scopeField,
      expected121Type: RegistrationAttributeTypes.text,
    });
  }

  private validateNoSubForm({
    fields,
  }: {
    fields: ActivityInfoFieldCleaned[];
  }): ActivityInfoValidationError | undefined {
    const subFormField = fields.find(
      (field) => field.type === ActivityInfoFieldType.subForm,
    );

    if (!subFormField) {
      return;
    }

    return {
      type: ActivityInfoValidationErrorType.subFormFound,
      attributeName: subFormField.code ?? subFormField.label,
      error: `Form contains a subform, which isn't supported`,
      solution: 'Remove the subform from the ActivityInfo form',
    };
  }

  private validateAllowedRegistrationViewAttributeTypes({
    fields,
  }: {
    fields: ActivityInfoFieldCleaned[];
  }): ActivityInfoValidationError[] {
    const hasRegistrationViewAttributeCode = (field: ActivityInfoFieldCleaned) =>
      isDefined(field.code) && registrationViewAttributeNames.includes(field.code);

    const hasExpectedType = (field: ActivityInfoFieldCleaned) =>
      isDefined(field.code) &&
      field.code in ACTIVITY_INFO_ALLOWED_REGISTRATION_VIEW_ATTRIBUTES;

    const getError = (field: ActivityInfoFieldCleaned) =>
      this.validateFieldTypeMatchesExpected121Type({
        attributeName: field.code ?? field.label,
        field,
        expected121Type:
          ACTIVITY_INFO_ALLOWED_REGISTRATION_VIEW_ATTRIBUTES[field.code ?? ''],
      });

    return fields
      .filter(hasRegistrationViewAttributeCode)
      .filter(hasExpectedType)
      .map(getError)
      .filter(isDefined);
  }

  private validateForbiddenRegistrationViewAttributes({
    fields,
  }: {
    fields: ActivityInfoFieldCleaned[];
  }): ActivityInfoValidationError[] {
    const isNotScope = (field: ActivityInfoFieldCleaned) =>
      field.code !== GenericRegistrationAttributes.scope;

    const isForbiddenAttribute = (field: ActivityInfoFieldCleaned) =>
      isDefined(field.code) &&
      this.isRegistrationViewAttributeName(field.code) &&
      !ACTIVITY_INFO_ALLOWED_REGISTRATION_VIEW_ATTRIBUTES[field.code];

    return fields
      .filter(isNotScope)
      .filter(isForbiddenAttribute)
      .map((field) => ({
        type: ActivityInfoValidationErrorType.forbiddenAttribute as const,
        attributeName: field.code ?? field.label,
        error: `'${field.code}' is a reserved attribute name and cannot be filled from ActivityInfo`,
        solution: `Change the code of the field '${field.label}' to a non-reserved name`,
      }));
  }

  private isRegistrationViewAttributeName(
    name: string,
  ): name is keyof RegistrationViewEntity {
    return registrationViewAttributeNames.includes(name);
  }

  private validateFspField({
    fields,
    fspConfigs,
  }: {
    fields: ActivityInfoFieldCleaned[];
    fspConfigs: { fspName: Fsps; name: string }[];
  }): ActivityInfoValidationError | undefined {
    const fspField = this.findFieldByCode({ fields, code: fspFieldCode });

    if (!fspField) {
      return {
        type: ActivityInfoValidationErrorType.missingField,
        attributeName: fspFieldCode,
        error: `Field is missing from your form`,
        solution: `Add a field with the code '${fspFieldCode}' to the ActivityInfo form`,
      };
    }

    const isSingleSelect =
      fspField.type === ActivityInfoFieldType.enumerated &&
      fspField.cardinality !== ActivityInfoEnumeratedCardinality.multiple;
    const isAllowedForAnyAttribute = (
      ACTIVITY_INFO_TYPES_ALLOWED_FOR_ANY_ATTRIBUTE as readonly string[]
    ).includes(fspField.type);

    if (!isSingleSelect && !isAllowedForAnyAttribute) {
      return {
        type: ActivityInfoValidationErrorType.typeMismatch,
        attributeName: fspFieldCode,
        error: `Attribute '${fspFieldCode}' has incompatible type '${fspField.type}'`,
        solution: 'Change the field type to an accepted type',
        info: `Expected a single-select '${ActivityInfoFieldType.enumerated}' field, or '${ActivityInfoFieldType.calculated}'`,
      };
    }

    if (isSingleSelect && fspField.choices.length > 0) {
      return this.validateFspFieldChoices({ fspField, fspConfigs });
    }
  }

  private validateFspFieldChoices({
    fspField,
    fspConfigs,
  }: {
    fspField: ActivityInfoFieldCleaned;
    fspConfigs: { fspName: Fsps; name: string }[];
  }): ActivityInfoValidationError | undefined {
    const fspConfigNames = new Set(fspConfigs.map((config) => config.name));

    const invalidChoices = fspField.choices
      .map((choice) => getOptionValueForChoice({ choice }))
      .filter((optionValue) => !fspConfigNames.has(optionValue));

    if (invalidChoices.length === 0) {
      // There is deliberately no check that every FSP config is represented in
      // the form: an FSP may be set only from within 121.
      return;
    }

    return {
      type: ActivityInfoValidationErrorType.invalidChoice,
      attributeName: fspFieldCode,
      error: `Attribute '${fspFieldCode}' has invalid choices: ${invalidChoices.join(', ')}`,
      solution: 'Update the choices to match FSP configuration names',
      info: `Valid FSP configuration names: ${[...fspConfigNames].join(', ')}`,
    };
  }

  private validateSingleSelectHasChoices({
    fields,
  }: {
    fields: ActivityInfoFieldCleaned[];
  }): ActivityInfoValidationError[] {
    return fields
      .filter(
        (field) =>
          field.type === ActivityInfoFieldType.enumerated &&
          field.choices.length === 0,
      )
      .map((field) => ({
        type: ActivityInfoValidationErrorType.singleSelectNoChoices as const,
        attributeName: field.code ?? field.label,
        error: `'${field.code ?? field.label}' is a select field but has no choices defined`,
        solution: 'Define at least one choice for the field in ActivityInfo',
      }));
  }

  private validateFieldTypeMatchesExpected121Type({
    attributeName,
    field,
    expected121Type,
  }: {
    attributeName: string;
    field: ActivityInfoFieldCleaned;
    expected121Type: RegistrationAttributeTypes;
  }): ActivityInfoValidationError | undefined {
    if (
      (ACTIVITY_INFO_TYPES_ALLOWED_FOR_ANY_ATTRIBUTE as readonly string[]).includes(
        field.type,
      )
    ) {
      return;
    }

    const actualAttributeType = resolveAttributeTypeForActivityInfoField({ field });

    // There is no ActivityInfo equivalent of a phone number field, so a text
    // field is accepted for the 121 'tel' type.
    const acceptedAttributeTypes =
      expected121Type === RegistrationAttributeTypes.tel
        ? [RegistrationAttributeTypes.tel, RegistrationAttributeTypes.text]
        : [expected121Type];

    if (actualAttributeType && acceptedAttributeTypes.includes(actualAttributeType)) {
      return;
    }

    return {
      type: ActivityInfoValidationErrorType.typeMismatch,
      attributeName,
      error: `Field type must not be '${field.type}'`,
      solution: 'Change the field type to an accepted type',
      info: `Expected one of: ${acceptedAttributeTypes
        .flatMap((attributeType) =>
          getActivityInfoTypesFor121Type({ attributeType }),
        )
        .map((type) => `'${type}'`)
        .join(', ')}`,
    };
  }

  private findFieldByCode({
    fields,
    code,
  }: {
    fields: ActivityInfoFieldCleaned[];
    code: string;
  }): ActivityInfoFieldCleaned | undefined {
    return fields.find((field) => field.code === code);
  }

  private collectErrors({
    accumulatedErrors,
    error,
  }: {
    accumulatedErrors: ActivityInfoValidationError[];
    error: ActivityInfoValidationError[] | ActivityInfoValidationError | undefined;
  }): ActivityInfoValidationError[] {
    if (!error) {
      return accumulatedErrors;
    }
    if (Array.isArray(error)) {
      return [...accumulatedErrors, ...error];
    }
    return [...accumulatedErrors, error];
  }
}

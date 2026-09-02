import { Injectable } from '@nestjs/common';

import { resolveAttributeTypeForActivityInfoField } from '@121-service/src/activityinfo/helpers/activityinfo-attribute-type.helper';
import { ActivityInfoChoiceCleaned } from '@121-service/src/activityinfo/interfaces/activityinfo-choice-cleaned.interface';
import { ActivityInfoFieldCleaned } from '@121-service/src/activityinfo/interfaces/activityinfo-field-cleaned.interface';
import { getOptionValueForChoice } from '@121-service/src/activityinfo/mappers/activityinfo-record.mapper';
import { ProgramRegistrationAttribute } from '@121-service/src/programs/interfaces/program-registration-attribute.interface';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';
import { RegistrationPreferredLanguageTranslation } from '@121-service/src/shared/types/registration-preferred-language-translation.type';

const DEFAULT_ATTRIBUTE_CONFIG = {
  showInPeopleAffectedTable: true,
  editableInPortal: true,
  isRequired: false,
};

@Injectable()
export class ActivityInfoFieldProcessorService {
  public fieldsToProgramRegistrationAttributes({
    fields,
    languageIsoCode,
  }: {
    fields: ActivityInfoFieldCleaned[];
    languageIsoCode: RegistrationPreferredLanguage;
  }): ProgramRegistrationAttribute[] {
    const registrationAttributes: ProgramRegistrationAttribute[] = [];

    for (const field of fields) {
      const attribute = this.fieldToProgramRegistrationAttribute({
        field,
        languageIsoCode,
      });

      if (attribute) {
        registrationAttributes.push(attribute);
      }
    }

    return registrationAttributes;
  }

  private fieldToProgramRegistrationAttribute({
    field,
    languageIsoCode,
  }: {
    field: ActivityInfoFieldCleaned;
    languageIsoCode: RegistrationPreferredLanguage;
  }): ProgramRegistrationAttribute | undefined {
    const attributeType = resolveAttributeTypeForActivityInfoField({ field });

    // Only fields with a supported type become registration attributes. Layout
    // elements and unsupported types that matter to the user are reported
    // during validation instead.
    if (!attributeType) {
      return;
    }

    // A field without a code cannot be named in 121 terms. Validation reports
    // this to the user, so here it is simply skipped.
    if (!field.code) {
      return;
    }

    return {
      name: field.code,
      activityInfoFieldId: field.id,
      activityInfoLabel: this.buildLabel({
        label: field.label,
        languageIsoCode,
        fallbackName: field.code,
      }),
      type: attributeType,
      options: this.transformChoicesToOptions({
        choices: field.choices,
        languageIsoCode,
      }),
      // ActivityInfo's 'required' flag can be conditional through
      // requiredCondition, so it is not carried over as a hard requirement.
      isRequired: DEFAULT_ATTRIBUTE_CONFIG.isRequired,
      showInPeopleAffectedTable:
        DEFAULT_ATTRIBUTE_CONFIG.showInPeopleAffectedTable,
      editableInPortal: DEFAULT_ATTRIBUTE_CONFIG.editableInPortal,
    };
  }

  private buildLabel({
    label,
    languageIsoCode,
    fallbackName,
  }: {
    label: string;
    languageIsoCode: RegistrationPreferredLanguage;
    fallbackName: string;
  }): RegistrationPreferredLanguageTranslation {
    if (!label) {
      return { [languageIsoCode]: fallbackName };
    }

    return { [languageIsoCode]: label };
  }

  private transformChoicesToOptions({
    choices,
    languageIsoCode,
  }: {
    choices: ActivityInfoChoiceCleaned[];
    languageIsoCode: RegistrationPreferredLanguage;
  }): { option: string; label: RegistrationPreferredLanguageTranslation }[] {
    return choices.map((choice) => ({
      option: getOptionValueForChoice({ choice }),
      label: { [languageIsoCode]: choice.label },
    }));
  }
}

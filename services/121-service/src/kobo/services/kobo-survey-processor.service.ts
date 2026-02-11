import { Injectable } from '@nestjs/common';

import { KOBO_TO_121_TYPE_MAPPING } from '@121-service/src/kobo/consts/kobo-survey-to-121-attribute-type.const';
import { KoboChoiceCleaned } from '@121-service/src/kobo/interfaces/kobo-choice-cleaned.interface';
import { KoboSurveyItemCleaned } from '@121-service/src/kobo/interfaces/kobo-survey-item-cleaned.interface';
import { ProgramRegistrationAttributeDto } from '@121-service/src/programs/dto/program-registration-attribute.dto';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';
import { RegistrationPreferredLanguageTranslation } from '@121-service/src/shared/types/registration-preferred-language-translation.type';

const DEFAULT_FALLBACK_LANGUAGE = RegistrationPreferredLanguage.en;
const DEFAULT_ATTRIBUTE_CONFIG = {
  showInPeopleAffectedTable: true,
  editableInPortal: true,
  isRequired: false,
};
@Injectable()
export class KoboSurveyProcessorService {
  public surveyToProgramRegistrationAttributes({
    surveyItems,
    languageIsoCodes,
  }: {
    surveyItems: KoboSurveyItemCleaned[];
    languageIsoCodes: RegistrationPreferredLanguage[];
  }): ProgramRegistrationAttributeDto[] {
    const registrationAttributes: ProgramRegistrationAttributeDto[] = [];
    for (const item of surveyItems) {
      const attribute = this.surveyItemToProgramRegistrationAttribute({
        koboSurveyItem: item,
        languageIsoCodes,
      });

      if (attribute) {
        registrationAttributes.push(attribute);
      }
    }
    return registrationAttributes;
  }

  private surveyItemToProgramRegistrationAttribute({
    koboSurveyItem,
    languageIsoCodes,
  }: {
    koboSurveyItem: KoboSurveyItemCleaned;
    languageIsoCodes: RegistrationPreferredLanguage[];
  }): ProgramRegistrationAttributeDto | undefined {
    const koboSeperaterIndex = 0; // We only consider the primary type before any spaces
    const primaryKoboType = koboSurveyItem.type.split(' ')[koboSeperaterIndex];
    const attributeType = KOBO_TO_121_TYPE_MAPPING[primaryKoboType];

    if (!attributeType) {
      // Only create program registration attributes for kobo survey items with supported types
      // survey items that are not supported which are relevant for the users are handled during the validation phase
      // this part excludes survey items that are not relevant at all for the 121 system (e.g. note, (begin + end of) group, etc.)
      return;
    }

    const name = koboSurveyItem.name;

    const label = this.getLabelForLanguages({
      koboLabels: koboSurveyItem.label,
      languageIsoCodes,
      name,
    });

    const options = this.transformChoicesToOptions({
      koboChoices: koboSurveyItem.choices,
      languageIsoCodes,
    });

    return {
      name,
      label,
      type: attributeType,
      options,
      isRequired:
        koboSurveyItem.required || DEFAULT_ATTRIBUTE_CONFIG.isRequired,
      showInPeopleAffectedTable:
        DEFAULT_ATTRIBUTE_CONFIG.showInPeopleAffectedTable,
      editableInPortal: DEFAULT_ATTRIBUTE_CONFIG.editableInPortal,
    };
  }

  private getLabelForLanguages({
    koboLabels,
    languageIsoCodes,
    name,
  }: {
    koboLabels: string[] | undefined;
    languageIsoCodes: RegistrationPreferredLanguage[];
    name: string;
  }): RegistrationPreferredLanguageTranslation {
    if (!koboLabels?.length) {
      return { [DEFAULT_FALLBACK_LANGUAGE]: name };
    }

    const label: RegistrationPreferredLanguageTranslation = {};
    for (const [index, lang] of languageIsoCodes.entries()) {
      if (index < koboLabels.length && koboLabels[index]) {
        label[lang] = koboLabels[index];
      }
    }

    return label;
  }

  private transformChoicesToOptions({
    koboChoices,
    languageIsoCodes,
  }: {
    koboChoices: KoboChoiceCleaned[];
    languageIsoCodes: RegistrationPreferredLanguage[];
  }): { option: string; label: RegistrationPreferredLanguageTranslation }[] {
    return koboChoices.map((choice) =>
      this.transformChoiceToOption({ choice, languageIsoCodes }),
    );
  }

  private transformChoiceToOption({
    choice,
    languageIsoCodes,
  }: {
    choice: KoboChoiceCleaned;
    languageIsoCodes: RegistrationPreferredLanguage[];
  }): { option: string; label: RegistrationPreferredLanguageTranslation } {
    const label: RegistrationPreferredLanguageTranslation = {};

    for (const [index, lang] of languageIsoCodes.entries()) {
      if (index < choice.label.length) {
        label[lang] = choice.label[index];
      }
    }

    return {
      option: choice.name,
      label,
    };
  }
}

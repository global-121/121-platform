import { Injectable } from '@nestjs/common';

import { KOBO_TO_121_TYPE_MAPPING } from '@121-service/src/kobo/consts/kobo-survey-to-121-attribute-type.const';
import { KoboChoiceDto } from '@121-service/src/kobo/dtos/kobo-api/kobo-choice.dto';
import { KoboSurveyItemCleaned } from '@121-service/src/kobo/interfaces/kobo-survey-item-cleaned.interface';
import { ProgramRegistrationAttributeDto } from '@121-service/src/programs/dto/program-registration-attribute.dto';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';
import { RegistrationPreferredLanguageTranslation } from '@121-service/src/shared/types/registration-preferred-language-translation.type';
import { UILanguageTranslation } from '@121-service/src/shared/types/ui-language-translation.type';

@Injectable()
export class KoboSurveyProcessorService {
  private static readonly DEFAULT_FALLBACK_LANGUAGE =
    RegistrationPreferredLanguage.en;
  private static readonly DEFAULT_ATTRIBUTE_CONFIG = {
    showInPeopleAffectedTable: true,
    editableInPortal: true,
    isRequired: false,
  };
  private static readonly KOBO_TYPE_SEPARATOR_INDEX = 0;

  public surveyToProgramRegistrationAttributes({
    koboSurvey,
    koboChoices,
    languageIsoCodes,
  }: {
    koboSurvey: KoboSurveyItemCleaned[];
    koboChoices: KoboChoiceDto[];
    languageIsoCodes: RegistrationPreferredLanguage[];
  }): ProgramRegistrationAttributeDto[] {
    const optionsPerListName = this.mapKoboChoicesToOptions({
      koboChoices,
      languageIsoCodes,
    });
    const registrationAttributes: ProgramRegistrationAttributeDto[] = [];
    for (const item of koboSurvey) {
      const attribute = this.surveyItemToProgramRegistrationAttribute({
        koboSurveyItem: item,
        optionsPerListName,
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
    optionsPerListName,
    languageIsoCodes,
  }: {
    koboSurveyItem: KoboSurveyItemCleaned;
    optionsPerListName: Record<
      string,
      { option: string; label: RegistrationPreferredLanguageTranslation }[]
    >;
    languageIsoCodes: RegistrationPreferredLanguage[];
  }): ProgramRegistrationAttributeDto | undefined {
    const primaryKoboType =
      koboSurveyItem.type.split(' ')[
        KoboSurveyProcessorService.KOBO_TYPE_SEPARATOR_INDEX
      ];
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

    const options =
      attributeType === RegistrationAttributeTypes.dropdown &&
      koboSurveyItem.select_from_list_name
        ? optionsPerListName[koboSurveyItem.select_from_list_name]
        : undefined;

    return {
      name,
      label,
      type: attributeType,
      isRequired:
        koboSurveyItem.required ||
        KoboSurveyProcessorService.DEFAULT_ATTRIBUTE_CONFIG.isRequired,
      showInPeopleAffectedTable:
        KoboSurveyProcessorService.DEFAULT_ATTRIBUTE_CONFIG
          .showInPeopleAffectedTable,
      editableInPortal:
        KoboSurveyProcessorService.DEFAULT_ATTRIBUTE_CONFIG.editableInPortal,
      options,
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
      return { [KoboSurveyProcessorService.DEFAULT_FALLBACK_LANGUAGE]: name };
    }

    const label: RegistrationPreferredLanguageTranslation = {};
    for (const [index, lang] of languageIsoCodes.entries()) {
      if (index < koboLabels.length && koboLabels[index]) {
        label[lang] = koboLabels[index];
      }
    }

    return label;
  }

  private mapKoboChoicesToOptions({
    koboChoices,
    languageIsoCodes,
  }: {
    koboChoices: KoboChoiceDto[];
    languageIsoCodes: RegistrationPreferredLanguage[];
  }): Record<
    string,
    { option: string; label: RegistrationPreferredLanguageTranslation }[]
  > {
    const optionsWithListNames = koboChoices.map((choice) => ({
      ...this.transformChoiceToOption({
        choice,
        languageIsoCodes,
      }),
      listName: choice.list_name,
    }));

    return this.groupOptionsByListName(optionsWithListNames);
  }

  private transformChoiceToOption({
    choice,
    languageIsoCodes,
  }: {
    choice: KoboChoiceDto;
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

  private groupOptionsByListName(
    options: {
      option: string;
      label: UILanguageTranslation;
      listName: string;
    }[],
  ): Record<string, { option: string; label: UILanguageTranslation }[]> {
    const grouped: Record<
      string,
      { option: string; label: UILanguageTranslation }[]
    > = {};

    options.forEach(({ option, label, listName }) => {
      if (!grouped[listName]) {
        grouped[listName] = [];
      }

      grouped[listName].push({ option, label });
    });

    return grouped;
  }
}

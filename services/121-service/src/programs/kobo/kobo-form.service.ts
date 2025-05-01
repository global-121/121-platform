import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import { ProgramRegistrationAttributeDto } from '@121-service/src/programs/dto/program-registration-attribute.dto';
import { KoboChoice } from '@121-service/src/programs/kobo/interfaces/kobo-choice.interface';
import { KoboSurveyItem } from '@121-service/src/programs/kobo/interfaces/kobo-survey-item.interface';
import { KOBO_TO_121_TYPE_MAPPING } from '@121-service/src/programs/kobo/kobo-to-121-type-mapping.const';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/program-registration-attribute.entity';
import { ProgramService } from '@121-service/src/programs/programs.service';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';

/**
 * Service responsible for processing Kobo surveys and transforming them into program attributes
 */
@Injectable()
export class KoboFormService {
  constructor(
    private readonly programService: ProgramService,
    @InjectRepository(ProgramRegistrationAttributeEntity)
    private readonly programRegistrationAttributeRepository: Repository<ProgramRegistrationAttributeEntity>,
  ) {}

  public async processKoboSurvey(
    koboInformation: {
      survey: KoboSurveyItem[];
      choices: KoboChoice[];
      languages: string[];
    },
    programId: number,
  ): Promise<void> {
    const optionsPerListName = this.mapKoboChoicesToOptions(
      koboInformation.choices,
      koboInformation.languages,
    );

    const iso2Languages = koboInformation.languages.map((lang) =>
      this.extractIsoCode(lang, 0),
    );

    for (const item of koboInformation.survey) {
      await this.createUpdateProgramAttributeFromKoboItem({
        item,
        programId,
        optionsPerListName,
        iso2Languages,
      });
    }
    // Add languages to the languages of the program
    const program = await this.programService.findProgramOrThrow(programId);

    const combinedLanguages = [
      ...new Set([...program.languages, ...iso2Languages]),
    ];
    await this.programService.updateProgram(programId, {
      languages: combinedLanguages,
    });
  }

  public async createUpdateProgramAttributeFromKoboItem({
    item,
    programId,
    optionsPerListName,
    iso2Languages,
  }: {
    item: KoboSurveyItem;
    programId: number;
    optionsPerListName: Record<
      string,
      { option: string; label: LocalizedString }[]
    >;
    iso2Languages: LanguageEnum[];
  }): Promise<void> {
    const baseType = item.type.split(' ')[0];

    const attributeType = KOBO_TO_121_TYPE_MAPPING[baseType];
    if (!attributeType) {
      // Only create questions with supported types
      return;
    }

    // Get the name - if it doesn't exist, use autoname as that is not set by the used in Kobo but automatically generated
    const name = item.name || item.$autoname;

    const label = {};
    if (!item.label || item.label?.length === 0) {
      label['en'] = item.name;
    } else {
      for (const lang of iso2Languages) {
        const index = iso2Languages.indexOf(lang);
        if (index < item.label!.length) {
          if (item.label![index]) {
            label[lang] = item.label![index];
          }
        }
      }
    }

    const attributeDto: ProgramRegistrationAttributeDto = {
      name,
      label,
      type: attributeType as RegistrationAttributeTypes,
      isRequired: item.required || false,
      showInPeopleAffectedTable: true,
      editableInPortal: true,
    };

    if (
      attributeType === RegistrationAttributeTypes.dropdown &&
      item.select_from_list_name
    ) {
      attributeDto.options = optionsPerListName[item.select_from_list_name];
    }

    await this.createOrUpdateAttribute(programId, name, attributeDto);
  }

  private async createOrUpdateAttribute(
    programId: number,
    name: string,
    attributeDto: ProgramRegistrationAttributeDto,
  ): Promise<void> {
    const existingAttribute =
      await this.programRegistrationAttributeRepository.findOne({
        where: {
          programId: Equal(programId),
          name: Equal(name),
        },
      });

    if (existingAttribute) {
      // Update the existing attribute
      await this.programService.updateProgramRegistrationAttribute(
        programId,
        name,
        attributeDto,
      );
      return;
    }

    // Create a new attribute
    await this.programService.createProgramRegistrationAttributeEntity({
      programId,
      createProgramRegistrationAttributeDto: attributeDto,
    });
  }

  public mapKoboChoicesToOptions(
    koboChoices: KoboChoice[],
    languages: string[],
  ): Record<string, { option: string; label: LocalizedString }[]> {
    const optionsWithListNames = koboChoices.map((choice) => ({
      ...this.transformChoiceToOption(choice, languages),
      listName: choice.list_name,
    }));

    return this.groupOptionsByListName(optionsWithListNames);
  }

  private extractIsoCode(
    languageString: string,
    fallbackIndex: number,
  ): LanguageEnum {
    const isoMatch = languageString.match(/\(([a-z]{2})\)/i);
    return (isoMatch ? isoMatch[1] : `lang${fallbackIndex}`) as LanguageEnum;
  }

  private transformChoiceToOption(
    choice: KoboChoice,
    languages: string[],
  ): { option: string; label: LocalizedString } {
    const label: LocalizedString = {};

    languages.forEach((lang, index) => {
      const isoCode = this.extractIsoCode(lang, index);

      if (index < choice.label.length) {
        label[isoCode] = choice.label[index];
      }
    });

    return {
      option: choice.name,
      label,
    };
  }

  private groupOptionsByListName(
    options: {
      option: string;
      label: LocalizedString;
      listName: string;
    }[],
  ): Record<string, { option: string; label: LocalizedString }[]> {
    const grouped: Record<
      string,
      { option: string; label: LocalizedString }[]
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

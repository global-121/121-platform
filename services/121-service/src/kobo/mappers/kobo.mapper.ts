import { KoboAssetDto } from '@121-service/src/kobo/dtos/kobo-api/kobo-asset.dto';
import { KoboChoiceDto } from '@121-service/src/kobo/dtos/kobo-api/kobo-choice.dto';
import { KoboSurveyItemDto } from '@121-service/src/kobo/dtos/kobo-api/kobo-survey-item.dto';
import { KoboResponseDto } from '@121-service/src/kobo/dtos/kobo-response.dto';
import { KoboEntity } from '@121-service/src/kobo/entities/kobo.entity';
import { KoboChoiceCleaned } from '@121-service/src/kobo/interfaces/kobo-choice-cleaned.interface';
import { KoboFormDefinition } from '@121-service/src/kobo/interfaces/kobo-form-definition.interface';
import { KoboSurveyItemCleaned } from '@121-service/src/kobo/interfaces/kobo-survey-item-cleaned.interface';

export class KoboMapper {
  public static mapEntityToDto(entity: KoboEntity): KoboResponseDto {
    const dto: KoboResponseDto = {
      assetUid: entity.assetUid,
      versionId: entity.versionId,
      dateDeployed: entity.dateDeployed,
      url: entity.url,
      programId: entity.programId,
      name: entity.name,
    };
    return dto;
  }

  public static mapEntitiesToDtos(entities: KoboEntity[]): KoboResponseDto[] {
    return entities.map(KoboMapper.mapEntityToDto);
  }

  public static formDefinitionToEntity({
    formDefinition,
    programId,
    assetUid,
    token,
    url,
    name,
  }: {
    formDefinition: KoboFormDefinition;
    programId: number;
    assetUid: string;
    token: string;
    url: string;
    name: string | null;
  }): Omit<KoboEntity, 'id' | 'created' | 'updated' | 'program'> {
    return {
      programId,
      assetUid,
      token,
      url,
      dateDeployed: formDefinition.dateDeployed,
      versionId: formDefinition.versionId,
      name,
    };
  }

  public static koboAssetDtoToKoboFormDefinition({
    asset,
  }: {
    asset: KoboAssetDto;
  }): KoboFormDefinition {
    const cleanedChoices = this.choicesDtosToChoicesCleaned({
      koboChoices: asset.content.choices || [],
    });

    return {
      name: asset.name ?? '',
      survey: this.surveyItemsDtosToSurveyItemsCleaned({
        koboSurveyItems: asset.content.survey || [],
        cleanedChoices,
      }),
      languages: asset.summary.languages || [],
      dateDeployed: asset.date_deployed,
      versionId: asset.version_id,
    };
  }

  private static surveyItemsDtosToSurveyItemsCleaned({
    koboSurveyItems,
    cleanedChoices,
  }: {
    koboSurveyItems: KoboSurveyItemDto[];
    cleanedChoices: KoboChoiceCleaned[];
  }): KoboSurveyItemCleaned[] {
    return koboSurveyItems.map((item) => {
      const parsedName = this.parseAttributeNameFromKoboSurveyItem({ item });
      const itemChoices = item.select_from_list_name
        ? cleanedChoices.filter(
            (choice) => choice.list_name === item.select_from_list_name,
          )
        : [];

      // This removes unnecessary properties from the KoboSurveyItems
      return {
        name: parsedName,
        type: item.type.split(' ')[0], // Normalize e.g. 'select_one list_name' to 'select_one'
        label: item.label,
        required: item.required,
        choices: itemChoices,
      };
    });
  }

  private static parseAttributeNameFromKoboSurveyItem({
    item,
  }: {
    item: KoboSurveyItemDto;
  }): string {
    const name = this.getNameSurveyItem({ koboSurveyItem: item });

    return this.parseAttributeNameFromKoboSurveyItemName({
      name,
    });
  }

  private static parseAttributeNameFromKoboSurveyItemName({
    name,
  }: {
    name: string;
  }): string {
    if (!name.includes('/')) {
      return name;
    }

    const parts = name.split('/');
    return parts[parts.length - 1];
  }

  private static choicesDtosToChoicesCleaned({
    koboChoices,
  }: {
    koboChoices: KoboChoiceDto[];
  }): KoboChoiceCleaned[] {
    return koboChoices.map((choice) => {
      const parsedName = this.getNameChoiceItem({ koboChoice: choice });
      return {
        name: parsedName,
        label: choice.label,
        list_name: choice.list_name,
      };
    });
  }

  private static getNameSurveyItem({
    koboSurveyItem: koboSurveyItem,
  }: {
    koboSurveyItem: KoboSurveyItemDto;
  }): string {
    return (
      koboSurveyItem.name || koboSurveyItem.$autoname || koboSurveyItem.$kuid
    );
  }

  private static getNameChoiceItem({
    koboChoice,
  }: {
    koboChoice: KoboChoiceDto;
  }): string {
    return koboChoice.name || koboChoice.$autovalue || koboChoice.$kuid;
  }
}

import { KoboSurveyItemDto } from '@121-service/src/kobo/dtos/kobo-api/kobo-survey-item.dto';
import { KoboResponseDto } from '@121-service/src/kobo/dtos/kobo-response.dto';
import { KoboEntity } from '@121-service/src/kobo/entities/kobo.entity';
import { KoboSurveyItemCleaned } from '@121-service/src/kobo/interfaces/kobo-survey-item-cleaned.interface';

export class KoboMapper {
  public static mapEntityToDto(entity: KoboEntity): KoboResponseDto {
    const dto: KoboResponseDto = {
      assetId: entity.assetId,
      versionId: entity.versionId,
      dateDeployed: entity.dateDeployed,
      url: entity.url,
      programId: entity.programId,
    };
    return dto;
  }

  public static mapEntitiesToDtos(entities: KoboEntity[]): KoboResponseDto[] {
    return entities.map((entity) => KoboMapper.mapEntityToDto(entity));
  }

  public static surveyItemsDtosToInterfaces({
    koboSurveyItems,
  }: {
    koboSurveyItems: KoboSurveyItemDto[];
  }): KoboSurveyItemCleaned[] {
    return koboSurveyItems.map((item) => {
      const parsedName = this.parseAttributeNameFromKoboSurveyItem({ item });
      return {
        name: parsedName,
        type: item.type,
        label: item.label,
        required: item.required,
        select_from_list_name: item.select_from_list_name,
      };
    });
  }

  private static parseAttributeNameFromKoboSurveyItem({
    item,
  }: {
    item: KoboSurveyItemDto;
  }): string {
    const name = item.name || item.$autoname || item.$kuid;

    return this.parseAttributeNameFromKoboSurveyItemName({
      name,
    });
  }

  private static parseAttributeNameFromKoboSurveyItemName({
    name,
  }: {
    name: string;
  }): string {
    if (name.includes('/')) {
      const parts = name.split('/');
      return parts[parts.length - 1];
    }
    return name;
  }
}

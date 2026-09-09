import { ActivityInfoResponseDto } from '@121-service/src/activityinfo/dtos/activityinfo-response.dto';
import { ActivityInfoEntity } from '@121-service/src/activityinfo/entities/activityinfo.entity';
import { ActivityInfoFormDefinition } from '@121-service/src/activityinfo/interfaces/activityinfo-form-definition.interface';

export class ActivityInfoEntityMapper {
  public static mapEntityToDto(
    activityInfoEntity: ActivityInfoEntity,
  ): ActivityInfoResponseDto {
    return {
      formId: activityInfoEntity.formId,
      schemaVersion: activityInfoEntity.schemaVersion,
      updated: activityInfoEntity.updated,
      url: activityInfoEntity.url,
      programId: activityInfoEntity.programId,
      name: activityInfoEntity.name,
    };
  }

  public static formDefinitionToEntity({
    formDefinition,
    programId,
    formId,
    token,
    url,
    name,
  }: {
    formDefinition: ActivityInfoFormDefinition;
    programId: number;
    formId: string;
    token: string;
    url: string;
    name: string | null;
  }): Partial<ActivityInfoEntity> {
    return {
      formId,
      token,
      url,
      programId,
      name,
      schemaVersion: formDefinition.schemaVersion,
    };
  }
}

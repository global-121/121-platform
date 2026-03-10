import { KoboResponseDto } from '@121-service/src/kobo/dtos/kobo-response.dto';
import { KoboEntity } from '@121-service/src/kobo/entities/kobo.entity';
import { KoboFormDefinition } from '@121-service/src/kobo/interfaces/kobo-form-definition.interface';

export class KoboEntityMapper {
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
    return entities.map(KoboEntityMapper.mapEntityToDto);
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
}

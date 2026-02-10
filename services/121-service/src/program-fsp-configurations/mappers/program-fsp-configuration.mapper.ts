import { FSP_SETTINGS } from '@121-service/src/fsp-integrations/settings/fsp-settings.const';
import {
  FspConfigurationPropertyVisibility,
  FspConfigurationPropertyVisibilityMap,
} from '@121-service/src/fsp-integrations/shared/consts/fps-configuration-property-visibility.const';
import { sensitivePropertyString } from '@121-service/src/program-fsp-configurations/const/sensitive-property-string.const';
import { CreateProgramFspConfigurationDto } from '@121-service/src/program-fsp-configurations/dtos/create-program-fsp-configuration.dto';
import { CreateProgramFspConfigurationPropertyDto } from '@121-service/src/program-fsp-configurations/dtos/create-program-fsp-configuration-property.dto';
import { ProgramFspConfigurationPropertyResponseDto } from '@121-service/src/program-fsp-configurations/dtos/program-fsp-configuration-property-response.dto';
import { ProgramFspConfigurationResponseDto } from '@121-service/src/program-fsp-configurations/dtos/program-fsp-configuration-response.dto';
import { ProgramFspConfigurationEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration.entity';
import { ProgramFspConfigurationPropertyEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration-property.entity';

export class ProgramFspConfigurationMapper {
  public static mapEntitiesToDtos(
    entities: ProgramFspConfigurationEntity[],
  ): ProgramFspConfigurationResponseDto[] {
    return entities.map((entity) =>
      ProgramFspConfigurationMapper.mapEntityToDto(entity),
    );
  }

  public static mapEntityToDto(
    entity: ProgramFspConfigurationEntity,
  ): ProgramFspConfigurationResponseDto {
    // Remove unnecessary properties from the fsp object
    const {
      configurationProperties: _configurationProperties,
      defaultLabel: _defaultLabel,
      ...fsp
    } = FSP_SETTINGS[entity.fspName];

    const dto: ProgramFspConfigurationResponseDto = {
      programId: entity.programId,
      fspName: entity.fspName,
      name: entity.name,
      label: entity.label,
      fsp,
      properties: ProgramFspConfigurationMapper.mapPropertyEntitiesToDtos(
        entity.properties,
      ),
    };
    return dto;
  }

  public static mapDtoToEntity(
    dto: CreateProgramFspConfigurationDto,
    programId: number,
  ): ProgramFspConfigurationEntity {
    const entity = new ProgramFspConfigurationEntity();
    entity.programId = programId;
    entity.fspName = dto.fspName;
    entity.name = dto.name;
    entity.label = dto.label;
    return entity;
  }

  public static mapPropertyEntitiesToDtos(
    properties?: ProgramFspConfigurationPropertyEntity[],
  ): ProgramFspConfigurationPropertyResponseDto[] {
    if (!properties) {
      return [];
    }
    return properties.map((property) =>
      ProgramFspConfigurationMapper.mapPropertyEntityToDto(property),
    );
  }

  public static mapPropertyEntityToDto(
    property: ProgramFspConfigurationPropertyEntity,
  ): ProgramFspConfigurationPropertyResponseDto {
    const isSecret =
      FspConfigurationPropertyVisibilityMap[property.name] ===
      FspConfigurationPropertyVisibility.secret;

    const value = isSecret ? sensitivePropertyString : property.value;
    return {
      name: property.name,
      value,
      updated: property.updated,
    };
  }

  public static mapPropertyDtosToEntities(
    dtos: CreateProgramFspConfigurationPropertyDto[],
    programFspConfigurationId: number,
  ): ProgramFspConfigurationPropertyEntity[] {
    return dtos.map((dto) =>
      ProgramFspConfigurationMapper.mapPropertyDtoToEntity(
        dto,
        programFspConfigurationId,
      ),
    );
  }

  private static mapPropertyDtoToEntity(
    dto: CreateProgramFspConfigurationPropertyDto,
    programFspConfigurationId: number,
  ): ProgramFspConfigurationPropertyEntity {
    const entity = new ProgramFspConfigurationPropertyEntity();
    entity.name = dto.name;
    entity.programFspConfigurationId = programFspConfigurationId;
    entity.value = dto.value;
    return entity;
  }
}

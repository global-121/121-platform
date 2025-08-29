import {
  FspConfigPropertyValueVisibility,
  FspConfigurationProperties,
} from '@121-service/src/fsps/enums/fsp-name.enum';
import { getFspSettingByNameOrThrow } from '@121-service/src/fsps/fsp-settings.helpers';
import { CreateProjectFspConfigurationDto } from '@121-service/src/project-fsp-configurations/dtos/create-project-fsp-configuration.dto';
import { CreateProjectFspConfigurationPropertyDto } from '@121-service/src/project-fsp-configurations/dtos/create-project-fsp-configuration-property.dto';
import { ProjectFspConfigurationPropertyResponseDto } from '@121-service/src/project-fsp-configurations/dtos/project-fsp-configuration-property-response.dto';
import { ProjectFspConfigurationResponseDto } from '@121-service/src/project-fsp-configurations/dtos/project-fsp-configuration-response.dto';
import { ProjectFspConfigurationEntity } from '@121-service/src/project-fsp-configurations/entities/project-fsp-configuration.entity';
import { ProjectFspConfigurationPropertyEntity } from '@121-service/src/project-fsp-configurations/entities/project-fsp-configuration-property.entity';

export class ProjectFspConfigurationMapper {
  public static mapEntitiesToDtos(
    entities: ProjectFspConfigurationEntity[],
  ): ProjectFspConfigurationResponseDto[] {
    return entities.map((entity) =>
      ProjectFspConfigurationMapper.mapEntityToDto(entity),
    );
  }

  public static mapEntityToDto(
    entity: ProjectFspConfigurationEntity,
  ): ProjectFspConfigurationResponseDto {
    // Remove unnecessary properties from the fsp object
    const {
      configurationProperties: _configurationProperties,
      defaultLabel: _defaultLabel,
      ...fsp
    } = getFspSettingByNameOrThrow(entity.fspName);

    const dto: ProjectFspConfigurationResponseDto = {
      projectId: entity.projectId,
      fspName: entity.fspName,
      name: entity.name,
      label: entity.label,
      fsp,
      properties: ProjectFspConfigurationMapper.mapPropertyEntitiesToDtos(
        entity.properties,
      ),
    };
    return dto;
  }

  public static mapDtoToEntity(
    dto: CreateProjectFspConfigurationDto,
    projectId: number,
  ): ProjectFspConfigurationEntity {
    const entity = new ProjectFspConfigurationEntity();
    entity.projectId = projectId;
    entity.fspName = dto.fspName;
    entity.name = dto.name;
    entity.label = dto.label;
    return entity;
  }

  public static mapPropertyEntitiesToDtos(
    properties?: ProjectFspConfigurationPropertyEntity[],
  ): ProjectFspConfigurationPropertyResponseDto[] {
    if (!properties) {
      return [];
    }
    return properties.map((property) =>
      ProjectFspConfigurationMapper.mapPropertyEntityToDto(property),
    );
  }

  public static mapPropertyEntityToDto(
    property: ProjectFspConfigurationPropertyEntity,
  ): ProjectFspConfigurationPropertyResponseDto {
    const isVisible = FspConfigPropertyValueVisibility[property.name];
    const value = isVisible ? property.value : '[********]';
    return {
      name: property.name,
      value,
      updated: property.updated,
    };
  }

  public static mapPropertyDtosToEntities(
    dtos: CreateProjectFspConfigurationPropertyDto[],
    projectFspConfigurationId: number,
  ): ProjectFspConfigurationPropertyEntity[] {
    return dtos.map((dto) =>
      ProjectFspConfigurationMapper.mapPropertyDtoToEntity(
        dto,
        projectFspConfigurationId,
      ),
    );
  }

  private static mapPropertyDtoToEntity(
    dto: CreateProjectFspConfigurationPropertyDto,
    projectFspConfigurationId: number,
  ): ProjectFspConfigurationPropertyEntity {
    const entity = new ProjectFspConfigurationPropertyEntity();
    entity.name = dto.name;
    entity.projectFspConfigurationId = projectFspConfigurationId;
    // Later we can add a switch case and a type for each property if there are more non-string properties
    entity.value =
      ProjectFspConfigurationMapper.mapPropertyDtoValueToEntityValue(
        dto.value,
        dto.name,
      );
    return entity;
  }

  public static mapPropertyDtoValueToEntityValue(
    dtoValue: string | string[],
    property: FspConfigurationProperties,
  ): string {
    // For now columnsToExport is the only property that is an array
    // Later we can add a switch case and a type for each property if there are more non-string properties
    if (property === FspConfigurationProperties.columnsToExport) {
      return JSON.stringify(dtoValue);
    }
    return dtoValue as string;
  }
}

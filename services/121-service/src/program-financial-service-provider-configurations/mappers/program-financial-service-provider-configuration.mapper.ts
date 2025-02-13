import { FinancialServiceProviderConfigurationProperties } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { getFinancialServiceProviderSettingByNameOrThrow } from '@121-service/src/financial-service-providers/financial-service-provider-settings.helpers';
import { CreateProgramFinancialServiceProviderConfigurationDto } from '@121-service/src/program-financial-service-provider-configurations/dtos/create-program-financial-service-provider-configuration.dto';
import { CreateProgramFinancialServiceProviderConfigurationPropertyDto } from '@121-service/src/program-financial-service-provider-configurations/dtos/create-program-financial-service-provider-configuration-property.dto';
import { ProgramFinancialServiceProviderConfigurationPropertyResponseDto } from '@121-service/src/program-financial-service-provider-configurations/dtos/program-financial-service-provider-configuration-property-response.dto';
import { ProgramFinancialServiceProviderConfigurationResponseDto } from '@121-service/src/program-financial-service-provider-configurations/dtos/program-financial-service-provider-configuration-response.dto';
import { ProjectFinancialServiceProviderConfigurationEntity } from '@121-service/src/program-financial-service-provider-configurations/entities/project-financial-service-provider-configuration.entity';
import { ProjectFinancialServiceProviderConfigurationPropertyEntity } from '@121-service/src/program-financial-service-provider-configurations/entities/project-financial-service-provider-configuration-property.entity';

export class ProgramFinancialServiceProviderConfigurationMapper {
  public static mapEntitiesToDtos(
    entities: ProjectFinancialServiceProviderConfigurationEntity[],
  ): ProgramFinancialServiceProviderConfigurationResponseDto[] {
    return entities.map((entity) =>
      ProgramFinancialServiceProviderConfigurationMapper.mapEntityToDto(entity),
    );
  }

  public static mapEntityToDto(
    entity: ProjectFinancialServiceProviderConfigurationEntity,
  ): ProgramFinancialServiceProviderConfigurationResponseDto {
    // Remove unnecessary properties from the financialServiceProvider object
    const {
      configurationProperties: _configurationProperties,
      defaultLabel: _defaultLabel,
      ...financialServiceProvider
    } = getFinancialServiceProviderSettingByNameOrThrow(
      entity.financialServiceProviderName,
    );

    const dto: ProgramFinancialServiceProviderConfigurationResponseDto = {
      programId: entity.projectId,
      financialServiceProviderName: entity.financialServiceProviderName,
      name: entity.name,
      label: entity.label,
      financialServiceProvider,
      properties:
        ProgramFinancialServiceProviderConfigurationMapper.mapPropertyEntitiesToDtos(
          entity.properties,
        ),
    };
    return dto;
  }

  public static mapDtoToEntity(
    dto: CreateProgramFinancialServiceProviderConfigurationDto,
    programId: number,
  ): ProjectFinancialServiceProviderConfigurationEntity {
    const entity = new ProjectFinancialServiceProviderConfigurationEntity();
    entity.projectId = programId;
    entity.financialServiceProviderName = dto.financialServiceProviderName;
    entity.name = dto.name;
    entity.label = dto.label;
    return entity;
  }

  public static mapPropertyEntitiesToDtos(
    properties?: ProjectFinancialServiceProviderConfigurationPropertyEntity[],
  ): ProgramFinancialServiceProviderConfigurationPropertyResponseDto[] {
    if (!properties) {
      return [];
    }
    return properties.map((property) =>
      ProgramFinancialServiceProviderConfigurationMapper.mapPropertyEntityToDto(
        property,
      ),
    );
  }

  public static mapPropertyEntityToDto(
    property: ProjectFinancialServiceProviderConfigurationPropertyEntity,
  ): ProgramFinancialServiceProviderConfigurationPropertyResponseDto {
    return {
      name: property.name,
      updated: property.updated,
    };
  }

  public static mapPropertyDtosToEntities(
    dtos: CreateProgramFinancialServiceProviderConfigurationPropertyDto[],
    projectFinancialServiceProviderConfigurationId: number,
  ): ProjectFinancialServiceProviderConfigurationPropertyEntity[] {
    return dtos.map((dto) =>
      ProgramFinancialServiceProviderConfigurationMapper.mapPropertyDtoToEntity(
        dto,
        projectFinancialServiceProviderConfigurationId,
      ),
    );
  }

  private static mapPropertyDtoToEntity(
    dto: CreateProgramFinancialServiceProviderConfigurationPropertyDto,
    projectFinancialServiceProviderConfigurationId: number,
  ): ProjectFinancialServiceProviderConfigurationPropertyEntity {
    const entity =
      new ProjectFinancialServiceProviderConfigurationPropertyEntity();
    entity.name = dto.name;
    entity.projectFinancialServiceProviderConfigurationId =
      projectFinancialServiceProviderConfigurationId;
    // Later we can add a switch case and a type for each property if there are more non-string properties
    entity.value =
      ProgramFinancialServiceProviderConfigurationMapper.mapPropertyDtoValueToEntityValue(
        dto.value,
        dto.name,
      );
    return entity;
  }

  public static mapPropertyDtoValueToEntityValue(
    dtoValue: string | string[],
    property: FinancialServiceProviderConfigurationProperties,
  ): string {
    // For now columnsToExport is the only property that is an array
    // Later we can add a switch case and a type for each property if there are more non-string properties
    if (
      property ===
      FinancialServiceProviderConfigurationProperties.columnsToExport
    ) {
      return JSON.stringify(dtoValue);
    }
    return dtoValue as string;
  }
}

import { FinancialServiceProviderConfigurationProperties } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { getFinancialServiceProviderSettingByNameOrThrow } from '@121-service/src/financial-service-providers/financial-service-provider-settings.helpers';
import { CreateProgramFinancialServiceProviderConfigurationDto } from '@121-service/src/program-financial-service-provider-configurations/dtos/create-program-financial-service-provider-configuration.dto';
import { CreateProgramFinancialServiceProviderConfigurationPropertyDto } from '@121-service/src/program-financial-service-provider-configurations/dtos/create-program-financial-service-provider-configuration-property.dto';
import { ProgramFinancialServiceProviderConfigurationPropertyResponseDto } from '@121-service/src/program-financial-service-provider-configurations/dtos/program-financial-service-provider-configuration-property-response.dto';
import { ProgramFinancialServiceProviderConfigurationResponseDto } from '@121-service/src/program-financial-service-provider-configurations/dtos/program-financial-service-provider-configuration-response.dto';
import { ProgramFinancialServiceProviderConfigurationEntity } from '@121-service/src/program-financial-service-provider-configurations/entities/program-financial-service-provider-configuration.entity';
import { ProgramFinancialServiceProviderConfigurationPropertyEntity } from '@121-service/src/program-financial-service-provider-configurations/entities/program-financial-service-provider-configuration-property.entity';

export class ProgramFinancialServiceProviderConfigurationMapper {
  public static mapEntitiesToDtos(
    entities: ProgramFinancialServiceProviderConfigurationEntity[],
  ): ProgramFinancialServiceProviderConfigurationResponseDto[] {
    return entities.map((entity) =>
      ProgramFinancialServiceProviderConfigurationMapper.mapEntityToDto(entity),
    );
  }

  public static mapEntityToDto(
    entity: ProgramFinancialServiceProviderConfigurationEntity,
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
      programId: entity.programId,
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
  ): ProgramFinancialServiceProviderConfigurationEntity {
    const entity = new ProgramFinancialServiceProviderConfigurationEntity();
    entity.programId = programId;
    entity.financialServiceProviderName = dto.financialServiceProviderName;
    entity.name = dto.name;
    entity.label = dto.label;
    return entity;
  }

  public static mapPropertyEntitiesToDtos(
    properties?: ProgramFinancialServiceProviderConfigurationPropertyEntity[],
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
    property: ProgramFinancialServiceProviderConfigurationPropertyEntity,
  ): ProgramFinancialServiceProviderConfigurationPropertyResponseDto {
    return {
      name: property.name,
      updated: property.updated,
    };
  }

  public static mapPropertyDtosToEntities(
    dtos: CreateProgramFinancialServiceProviderConfigurationPropertyDto[],
    programFinancialServiceProviderConfigurationId: number,
  ): ProgramFinancialServiceProviderConfigurationPropertyEntity[] {
    return dtos.map((dto) =>
      ProgramFinancialServiceProviderConfigurationMapper.mapPropertyDtoToEntity(
        dto,
        programFinancialServiceProviderConfigurationId,
      ),
    );
  }

  private static mapPropertyDtoToEntity(
    dto: CreateProgramFinancialServiceProviderConfigurationPropertyDto,
    programFinancialServiceProviderConfigurationId: number,
  ): ProgramFinancialServiceProviderConfigurationPropertyEntity {
    const entity =
      new ProgramFinancialServiceProviderConfigurationPropertyEntity();
    entity.name = dto.name;
    entity.programFinancialServiceProviderConfigurationId =
      programFinancialServiceProviderConfigurationId;
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

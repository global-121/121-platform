import { FspConfigurationProperties } from '@121-service/src/fsps/enums/fsp-name.enum';
import { getFinancialServiceProviderSettingByNameOrThrow } from '@121-service/src/fsps/fsp-settings.helpers';
import { CreateProgramFinancialServiceProviderConfigurationDto } from '@121-service/src/program-fsp-configurations/dtos/create-program-fsp-configuration.dto';
import { CreateProgramFinancialServiceProviderConfigurationPropertyDto } from '@121-service/src/program-fsp-configurations/dtos/create-program-fsp-configuration-property.dto';
import { ProgramFinancialServiceProviderConfigurationPropertyResponseDto } from '@121-service/src/program-fsp-configurations/dtos/program-fsp-configuration-property-response.dto';
import { ProgramFinancialServiceProviderConfigurationResponseDto } from '@121-service/src/program-fsp-configurations/dtos/program-fsp-configuration-response.dto';
import { ProgramFspConfigurationEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration.entity';
import { ProgramFspConfigurationPropertyEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration-property.entity';

export class ProgramFinancialServiceProviderConfigurationMapper {
  public static mapEntitiesToDtos(
    entities: ProgramFspConfigurationEntity[],
  ): ProgramFinancialServiceProviderConfigurationResponseDto[] {
    return entities.map((entity) =>
      ProgramFinancialServiceProviderConfigurationMapper.mapEntityToDto(entity),
    );
  }

  public static mapEntityToDto(
    entity: ProgramFspConfigurationEntity,
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
  ): ProgramFspConfigurationEntity {
    const entity = new ProgramFspConfigurationEntity();
    entity.programId = programId;
    entity.financialServiceProviderName = dto.financialServiceProviderName;
    entity.name = dto.name;
    entity.label = dto.label;
    return entity;
  }

  public static mapPropertyEntitiesToDtos(
    properties?: ProgramFspConfigurationPropertyEntity[],
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
    property: ProgramFspConfigurationPropertyEntity,
  ): ProgramFinancialServiceProviderConfigurationPropertyResponseDto {
    return {
      name: property.name,
      updated: property.updated,
    };
  }

  public static mapPropertyDtosToEntities(
    dtos: CreateProgramFinancialServiceProviderConfigurationPropertyDto[],
    programFinancialServiceProviderConfigurationId: number,
  ): ProgramFspConfigurationPropertyEntity[] {
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
  ): ProgramFspConfigurationPropertyEntity {
    const entity = new ProgramFspConfigurationPropertyEntity();
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

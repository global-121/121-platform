import { FINANCIAL_SERVICE_PROVIDERS } from '@121-service/src/financial-service-providers/financial-service-providers.const';
import { ProgramFinancialServiceProviderConfigurationResponseDto } from '@121-service/src/program-financial-service-provider-configurations/dtos/program-financial-service-provider-configuration-response.dto';
import { ProgramFinancialServiceProviderConfigurationEntity } from '../entities/program-financial-service-provider-configuration.entity';

export class ProgramFinancialServiceProviderConfigurationMapper {
  public static mapEntitiesToDtos(
    entities: ProgramFinancialServiceProviderConfigurationEntity[],
  ): ProgramFinancialServiceProviderConfigurationResponseDto[] {
    return entities.map((entity) =>
      ProgramFinancialServiceProviderConfigurationMapper.mapEntitytoDto(entity),
    );
  }

  public static mapEntitytoDto(
    entity: ProgramFinancialServiceProviderConfigurationEntity,
  ): ProgramFinancialServiceProviderConfigurationResponseDto {
    const financialServiceProvider = FINANCIAL_SERVICE_PROVIDERS.find(
      (fsp) => fsp.name === entity.financialServiceProviderName,
    );

    const dto: ProgramFinancialServiceProviderConfigurationResponseDto = {
      programId: entity.programId,
      financialServiceProviderName: entity.financialServiceProviderName,
      name: entity.name,
      label: entity.label,
      financialServiceProvider: financialServiceProvider,
    };
    return dto;
  }
}

import { FINANCIAL_SERVICE_PROVIDERS } from '@121-service/src/financial-service-providers/financial-service-providers.const';
import { ProgramFinancialServiceProviderConfigurationResponseDto } from '@121-service/src/program-financial-service-provider-configurations/dtos/program-financial-service-provider-configuration-response.dto';
import { ProgramFinancialServiceProviderConfigurationEntity } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configuration.entity';

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
    const dto = new ProgramFinancialServiceProviderConfigurationResponseDto();

    dto.programId = entity.programId;
    dto.financialServiceProviderName = entity.financialServiceProviderName;
    dto.name = entity.name;
    dto.label = entity.label;
    const financialServiceProvider = FINANCIAL_SERVICE_PROVIDERS.find(
      (fsp) => fsp.name === entity.financialServiceProviderName,
    );
    dto.financialServiceProvider = financialServiceProvider;
    return dto;
  }
}

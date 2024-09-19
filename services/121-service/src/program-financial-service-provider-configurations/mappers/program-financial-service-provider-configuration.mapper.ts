import { FINANCIAL_SERVICE_PROVIDERS } from '@121-service/src/financial-service-providers/financial-service-providers.const';
import { ProgramFinancialServiceProviderConfigurationReturnDto } from '@121-service/src/program-financial-service-provider-configurations/dtos/program-financial-service-provider-configuration-return.dto';
import { ProgramFinancialServiceProviderConfigurationEntity } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configuration.entity';

export class ProgramFinancialServiceProviderConfigurationMapper {
  public static mapEntitiesToDtos(
    entities: ProgramFinancialServiceProviderConfigurationEntity[],
  ): ProgramFinancialServiceProviderConfigurationReturnDto[] {
    return entities.map((entity) =>
      ProgramFinancialServiceProviderConfigurationMapper.mapEntitytoDto(entity),
    );
  }

  public static mapEntitytoDto(
    entity: ProgramFinancialServiceProviderConfigurationEntity,
  ): ProgramFinancialServiceProviderConfigurationReturnDto {
    const dto = new ProgramFinancialServiceProviderConfigurationReturnDto();

    dto.programId = entity.programId;
    dto.financialServiceProviderName = entity.financialServiceProviderName;
    dto.name = entity.name;
    dto.label = entity.label;
    const financialServiceProvider = FINANCIAL_SERVICE_PROVIDERS.find(
      (fsp) => fsp.name === entity.financialServiceProviderName,
    );
    if (!financialServiceProvider) {
      throw new Error(
        'Financial service provider assigned to program not found in the list of available financial service providers',
      );
    }
    dto.financialServiceProvider = financialServiceProvider;
    return dto;
  }
}

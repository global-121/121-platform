import { FspConfigurationEnum } from '../../fsp/enum/fsp-name.enum';
import { FinancialServiceProviderEntity } from '../../fsp/financial-service-provider.entity';
import { ProgramFspConfigurationEntity } from '../fsp-configuration/program-fsp-configuration.entity';

export function overwriteProgramFspDisplayName(
  programFinancialServiceProviders: FinancialServiceProviderEntity[],
  programFinancialServiceProviderConfigurations: ProgramFspConfigurationEntity[],
): FinancialServiceProviderEntity[] {
  let overwrittenProgramFinancialServiceProviders: FinancialServiceProviderEntity[] =
    [];

  if (programFinancialServiceProviders.length > 0) {
    overwrittenProgramFinancialServiceProviders =
      programFinancialServiceProviders.map((financialServiceProvider) => {
        const displayNameConfig =
          programFinancialServiceProviderConfigurations.filter(
            (programFinancialServiceProviderConfiguration) =>
              programFinancialServiceProviderConfiguration.fspId ===
                financialServiceProvider.id &&
              programFinancialServiceProviderConfiguration.name ===
                FspConfigurationEnum.displayName,
          );

        if (displayNameConfig.length > 0) {
          financialServiceProvider.displayName = displayNameConfig[0]
            .value as unknown as JSON;
        }

        return financialServiceProvider;
      });
  }

  return overwrittenProgramFinancialServiceProviders;
}

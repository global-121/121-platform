import { FinancialServiceProviderConfigurationEnum } from '../../financial-service-provider/enum/financial-service-provider-name.enum';
import { FinancialServiceProviderEntity } from '../../financial-service-provider/financial-service-provider.entity';
import { RegistrationViewEntity } from '../../registration/registration-view.entity';
import { ProgramFspConfigurationEntity } from '../fsp-configuration/program-fsp-configuration.entity';
import { ProgramEntity } from '../program.entity';

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
                FinancialServiceProviderConfigurationEnum.displayName,
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

export function getFspDisplayNameMapping(
  program: ProgramEntity,
): Record<string, JSON> {
  if (!program.financialServiceProviders || !program.programFspConfiguration) {
    throw new Error(
      `getFspDisplayNameMapping: Should be used with a program entity relations ['financialServiceProviders', 'programFspConfiguration']`,
    );
  }
  const map = {};
  if (program.financialServiceProviders.length > 0) {
    program.financialServiceProviders = overwriteProgramFspDisplayName(
      program.financialServiceProviders,
      program.programFspConfiguration,
    );
  }
  for (const fsp of program.financialServiceProviders) {
    map[fsp.fsp] = fsp.displayName;
  }
  return map;
}

export function overwriteFspDisplayName(
  registration: RegistrationViewEntity,
  fspDisplayNameMapping: Record<string, JSON>,
): JSON {
  if (registration.financialServiceProvider) {
    return fspDisplayNameMapping[registration.financialServiceProvider];
  }
}

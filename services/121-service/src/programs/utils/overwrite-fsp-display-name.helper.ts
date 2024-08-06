import { FinancialServiceProviderConfigurationEnum } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { FinancialServiceProviderEntity } from '@121-service/src/financial-service-providers/financial-service-provider.entity';
import { ProgramFinancialServiceProviderConfigurationEntity } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configuration.entity';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { RegistrationViewEntity } from '@121-service/src/registration/registration-view.entity';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';
import { isArray, isObject } from 'lodash';

export function overwriteProgramFspDisplayName(
  programFinancialServiceProviders: FinancialServiceProviderEntity[],
  programFinancialServiceProviderConfigurations: ProgramFinancialServiceProviderConfigurationEntity[],
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
          // TODO: there should be a cleaner way to handle things here
          // should "value" really have the capability of being all of these things?
          if (
            isObject(displayNameConfig[0].value) &&
            !isArray(displayNameConfig[0].value)
          ) {
            financialServiceProvider.displayName = displayNameConfig[0]
              .value as LocalizedString;
          }
        }

        return financialServiceProvider;
      });
  }

  return overwrittenProgramFinancialServiceProviders;
}

export function getFspDisplayNameMapping(
  program: ProgramEntity,
): Record<string, LocalizedString> {
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
  financialServiceProvider: RegistrationViewEntity['financialServiceProvider'],
  fspDisplayNameMapping?: Record<string, LocalizedString>,
): LocalizedString | undefined {
  if (!financialServiceProvider || !fspDisplayNameMapping) {
    return undefined;
  }
  return fspDisplayNameMapping[financialServiceProvider];
}

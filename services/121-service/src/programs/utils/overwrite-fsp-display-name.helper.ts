import { isArray, isObject } from 'lodash';
import { LocalizedString } from 'src/shared/enum/language.enums';
import { FinancialServiceProviderConfigurationEnum } from '../../financial-service-providers/enum/financial-service-provider-name.enum';
import { FinancialServiceProviderEntity } from '../../financial-service-providers/financial-service-provider.entity';
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
          // TODO: there should be a cleaner way to handle things here
          // should "value" really have the capability of being all of these things?
          if (
            isObject(displayNameConfig[0].value) &&
            !isArray(displayNameConfig[0].value)
          ) {
            financialServiceProvider.displayName = displayNameConfig[0].value;
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
  registration: RegistrationViewEntity,
  fspDisplayNameMapping: Record<string, LocalizedString>,
): LocalizedString {
  if (registration.financialServiceProvider) {
    return fspDisplayNameMapping[registration.financialServiceProvider];
  }
}

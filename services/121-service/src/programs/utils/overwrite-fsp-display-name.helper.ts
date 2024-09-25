import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';

export function getprogramFinancialServiceProviderConfigurationLabelMapping(
  program: ProgramEntity,
): Record<string, LocalizedString> {
  if (!program.programFinancialServiceProviderConfigurations) {
    throw new Error(
      `getprogramFinancialServiceProviderConfigurationLabelMapping: Should be used with a program entity relations ['programFinancialServiceProviderConfigurations']`,
    );
  }
  const map = {};

  for (const fspConfig of program.programFinancialServiceProviderConfigurations) {
    map[fspConfig.financialServiceProviderName] = fspConfig.label;
  }
  return map;
}

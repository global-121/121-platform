import { FinancialServiceProviders } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { FinancialServiceProviderDto } from '@121-service/src/financial-service-providers/financial-service-provider.dto';
import { FINANCIAL_SERVICE_PROVIDER_SETTINGS } from '@121-service/src/financial-service-providers/financial-service-providers-settings.const';

export function getFinancialServiceProviderSettingByNameOrThrow(
  name: string,
): FinancialServiceProviderDto {
  const foundFsp = FINANCIAL_SERVICE_PROVIDER_SETTINGS.find(
    (fsp) => fsp.name === name,
  );
  if (!foundFsp) {
    throw new Error(`Financial service provider with name ${name} not found`);
  } else {
    return foundFsp;
  }
}

export function getFinancialServiceProviderConfigurationProperties(
  financialServiceProviderName: FinancialServiceProviders,
): string[] {
  const foundFsp = getFinancialServiceProviderSettingByNameOrThrow(
    financialServiceProviderName,
  );
  return foundFsp.configurationProperties.map((property) => property.name);
}

export function getFinancialServiceProviderConfigurationRequiredProperties(
  financialServiceProviderName: FinancialServiceProviders,
): string[] {
  const foundFsp = getFinancialServiceProviderSettingByNameOrThrow(
    financialServiceProviderName,
  );
  return foundFsp.configurationProperties
    .filter((property) => property.isRequired)
    .map((property) => property.name);
}

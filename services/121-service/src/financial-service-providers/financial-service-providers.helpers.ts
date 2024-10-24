import { FinancialServiceProviders } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { FinancialServiceProviderDto } from '@121-service/src/financial-service-providers/financial-service-provider.dto';
import { FINANCIAL_SERVICE_PROVIDERS } from '@121-service/src/financial-service-providers/financial-service-providers.const';

export function findFinancialServiceProviderByNameOrFail(
  name: string,
): FinancialServiceProviderDto {
  const foundFsp = FINANCIAL_SERVICE_PROVIDERS.find((fsp) => fsp.name === name);
  if (!foundFsp) {
    throw new Error(`Financial service provider with name ${name} not found`);
  } else {
    return foundFsp;
  }
}

export function findConfigurationProperties(
  financialServiceProviderName: FinancialServiceProviders,
): string[] {
  const foundFsp = findFinancialServiceProviderByNameOrFail(
    financialServiceProviderName,
  );
  return foundFsp.configurationProperties.map((property) => property.name);
}

export function findRequiredConfigurationProperties(
  financialServiceProviderName: FinancialServiceProviders,
): string[] {
  const foundFsp = findFinancialServiceProviderByNameOrFail(
    financialServiceProviderName,
  );
  return foundFsp.configurationProperties
    .filter((property) => property.isRequired)
    .map((property) => property.name);
}

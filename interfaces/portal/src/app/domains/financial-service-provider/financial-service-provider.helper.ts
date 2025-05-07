import { FinancialServiceProviders } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { FINANCIAL_SERVICE_PROVIDER_SETTINGS } from '@121-service/src/financial-service-providers/financial-service-providers-settings.const';

export const getFinancialServiceProviderSettingByName = (
  name: FinancialServiceProviders,
) => FINANCIAL_SERVICE_PROVIDER_SETTINGS.find((fsp) => fsp.name === name);

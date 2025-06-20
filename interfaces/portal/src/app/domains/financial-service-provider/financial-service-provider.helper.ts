import { FinancialServiceProviders } from '@121-service/src/fsps/enums/fsp-name.enum';
import { FINANCIAL_SERVICE_PROVIDER_SETTINGS } from '@121-service/src/fsps/fsp-settings.const';

export const getFinancialServiceProviderSettingByName = (
  name: FinancialServiceProviders,
) => FINANCIAL_SERVICE_PROVIDER_SETTINGS.find((fsp) => fsp.name === name);

import {
  FinancialServiceProviderConfigurationProperties,
  FinancialServiceProviders,
} from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { FINANCIAL_SERVICE_PROVIDER_SETTINGS } from '@121-service/src/financial-service-providers/financial-service-providers-settings.const';

export const getFinancialServiceProviderSettingByName = (
  name: FinancialServiceProviders,
) => FINANCIAL_SERVICE_PROVIDER_SETTINGS.find((fsp) => fsp.name === name);

export const FINANCIAL_SERVICE_PROVIDER_CONFIGURATION_PROPERTY_LABELS: Record<
  FinancialServiceProviderConfigurationProperties,
  string
> = {
  [FinancialServiceProviderConfigurationProperties.password]: $localize`Password`,
  [FinancialServiceProviderConfigurationProperties.username]: $localize`Username`,
  [FinancialServiceProviderConfigurationProperties.columnsToExport]: $localize`Columns to export`,
  [FinancialServiceProviderConfigurationProperties.columnToMatch]: $localize`Column to match`,
  [FinancialServiceProviderConfigurationProperties.brandCode]: $localize`Brand code`,
  [FinancialServiceProviderConfigurationProperties.coverLetterCode]: $localize`Cover letter code`,
  [FinancialServiceProviderConfigurationProperties.fundingTokenCode]: $localize`Funding token code`,
  [FinancialServiceProviderConfigurationProperties.paymentReferencePrefix]: $localize`Payment reference prefix`,
};

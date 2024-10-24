import {
  FinancialServiceProviderConfigurationProperties,
  FinancialServiceProviders,
} from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';

// ##TODO: Merge this mapping with the one in financial-service-providers.const.ts??? To be decide when implementing the FSP config api
export const FinancialServiceProviderConfigurationMapping: {
  [key in FinancialServiceProviders]?: FinancialServiceProviderConfigurationProperties[];
} = {
  [FinancialServiceProviders.intersolveVoucherWhatsapp]: [
    FinancialServiceProviderConfigurationProperties.password,
    FinancialServiceProviderConfigurationProperties.username,
    FinancialServiceProviderConfigurationProperties.displayName,
  ],
  [FinancialServiceProviders.intersolveVoucherPaper]: [
    FinancialServiceProviderConfigurationProperties.password,
    FinancialServiceProviderConfigurationProperties.username,
    FinancialServiceProviderConfigurationProperties.displayName,
  ],
  [FinancialServiceProviders.intersolveVisa]: [
    FinancialServiceProviderConfigurationProperties.brandCode,
    FinancialServiceProviderConfigurationProperties.coverLetterCode,
    FinancialServiceProviderConfigurationProperties.displayName,
    FinancialServiceProviderConfigurationProperties.fundingTokenCode,
  ],
  [FinancialServiceProviders.vodacash]: [
    FinancialServiceProviderConfigurationProperties.displayName,
  ],
  [FinancialServiceProviders.safaricom]: [
    FinancialServiceProviderConfigurationProperties.displayName,
  ],
  [FinancialServiceProviders.commercialBankEthiopia]: [
    FinancialServiceProviderConfigurationProperties.password,
    FinancialServiceProviderConfigurationProperties.username,
    FinancialServiceProviderConfigurationProperties.displayName,
  ],
  [FinancialServiceProviders.excel]: [
    FinancialServiceProviderConfigurationProperties.columnsToExport,
    FinancialServiceProviderConfigurationProperties.columnToMatch,
    FinancialServiceProviderConfigurationProperties.displayName,
  ],
};

export const RequiredFinancialServiceProviderConfigurations: {
  [key in FinancialServiceProviders]?: FinancialServiceProviderConfigurationProperties[];
} = {
  [FinancialServiceProviders.intersolveVoucherWhatsapp]: [
    FinancialServiceProviderConfigurationProperties.password,
    FinancialServiceProviderConfigurationProperties.username,
  ],
  [FinancialServiceProviders.intersolveVoucherPaper]: [
    FinancialServiceProviderConfigurationProperties.password,
    FinancialServiceProviderConfigurationProperties.username,
  ],
  [FinancialServiceProviders.intersolveVisa]: [
    FinancialServiceProviderConfigurationProperties.brandCode,
    FinancialServiceProviderConfigurationProperties.coverLetterCode,
    FinancialServiceProviderConfigurationProperties.fundingTokenCode,
  ],
  [FinancialServiceProviders.commercialBankEthiopia]: [
    FinancialServiceProviderConfigurationProperties.password,
    FinancialServiceProviderConfigurationProperties.username,
  ],
  [FinancialServiceProviders.excel]: [
    FinancialServiceProviderConfigurationProperties.columnsToExport,
    FinancialServiceProviderConfigurationProperties.columnToMatch,
  ],
};

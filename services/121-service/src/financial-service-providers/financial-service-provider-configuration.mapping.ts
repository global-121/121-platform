import {
  FinancialServiceProviderConfigurationEnum,
  FinancialServiceProviderName,
} from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';

// ##TODO: Merge this mapping with the one in financial-service-providers.const.ts??? To be decide when implementing the FSP config api
export const FinancialServiceProviderConfigurationMapping: {
  [key in FinancialServiceProviderName]?: any;
} = {
  [FinancialServiceProviderName.intersolveVoucherWhatsapp]: [
    FinancialServiceProviderConfigurationEnum.password,
    FinancialServiceProviderConfigurationEnum.username,
    FinancialServiceProviderConfigurationEnum.displayName,
  ],
  [FinancialServiceProviderName.intersolveVoucherPaper]: [
    FinancialServiceProviderConfigurationEnum.password,
    FinancialServiceProviderConfigurationEnum.username,
    FinancialServiceProviderConfigurationEnum.displayName,
  ],
  [FinancialServiceProviderName.intersolveVisa]: [
    FinancialServiceProviderConfigurationEnum.brandCode,
    FinancialServiceProviderConfigurationEnum.coverLetterCode,
    FinancialServiceProviderConfigurationEnum.displayName,
    FinancialServiceProviderConfigurationEnum.fundingTokenCode,
  ],
  [FinancialServiceProviderName.vodacash]: [
    FinancialServiceProviderConfigurationEnum.displayName,
  ],
  [FinancialServiceProviderName.safaricom]: [
    FinancialServiceProviderConfigurationEnum.displayName,
  ],
  [FinancialServiceProviderName.commercialBankEthiopia]: [
    FinancialServiceProviderConfigurationEnum.password,
    FinancialServiceProviderConfigurationEnum.username,
    FinancialServiceProviderConfigurationEnum.displayName,
  ],
  [FinancialServiceProviderName.excel]: [
    FinancialServiceProviderConfigurationEnum.columnsToExport,
    FinancialServiceProviderConfigurationEnum.columnToMatch,
    FinancialServiceProviderConfigurationEnum.displayName,
  ],
};

export const RequiredFinancialServiceProviderConfigurations: {
  [key in FinancialServiceProviderName]?: any;
} = {
  [FinancialServiceProviderName.intersolveVoucherWhatsapp]: [
    FinancialServiceProviderConfigurationEnum.password,
    FinancialServiceProviderConfigurationEnum.username,
  ],
  [FinancialServiceProviderName.intersolveVoucherPaper]: [
    FinancialServiceProviderConfigurationEnum.password,
    FinancialServiceProviderConfigurationEnum.username,
  ],
  [FinancialServiceProviderName.intersolveVisa]: [
    FinancialServiceProviderConfigurationEnum.brandCode,
    FinancialServiceProviderConfigurationEnum.coverLetterCode,
    FinancialServiceProviderConfigurationEnum.fundingTokenCode,
  ],
  [FinancialServiceProviderName.commercialBankEthiopia]: [
    FinancialServiceProviderConfigurationEnum.password,
    FinancialServiceProviderConfigurationEnum.username,
  ],
  [FinancialServiceProviderName.excel]: [
    FinancialServiceProviderConfigurationEnum.columnsToExport,
    FinancialServiceProviderConfigurationEnum.columnToMatch,
  ],
};

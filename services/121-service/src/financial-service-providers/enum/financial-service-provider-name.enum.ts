export enum FinancialServiceProviders {
  intersolveVoucherWhatsapp = 'Intersolve-voucher-whatsapp',
  intersolveVoucherPaper = 'Intersolve-voucher-paper',
  intersolveVisa = 'Intersolve-visa',
  safaricom = 'Safaricom',
  commercialBankEthiopia = 'Commercial-bank-ethiopia',
  excel = 'Excel',
}

export enum FinancialServiceProviderConfigurationEnum {
  password = 'password',
  username = 'username',
  columnsToExport = 'columnsToExport',
  columnToMatch = 'columnToMatch',
  brandCode = 'brandCode',
  displayName = 'displayName',
  coverLetterCode = 'coverLetterCode',
}

export const FinancialServiceProviderConfigurationMapping: Record<
  FinancialServiceProviders,
  FinancialServiceProviderConfigurationEnum[]
> = {
  [FinancialServiceProviders.intersolveVoucherWhatsapp]: [
    FinancialServiceProviderConfigurationEnum.password,
    FinancialServiceProviderConfigurationEnum.username,
    FinancialServiceProviderConfigurationEnum.displayName,
  ],
  [FinancialServiceProviders.intersolveVoucherPaper]: [
    FinancialServiceProviderConfigurationEnum.password,
    FinancialServiceProviderConfigurationEnum.username,
    FinancialServiceProviderConfigurationEnum.displayName,
  ],
  [FinancialServiceProviders.intersolveVisa]: [
    FinancialServiceProviderConfigurationEnum.brandCode,
    FinancialServiceProviderConfigurationEnum.coverLetterCode,
    FinancialServiceProviderConfigurationEnum.displayName,
  ],
  [FinancialServiceProviders.safaricom]: [
    FinancialServiceProviderConfigurationEnum.displayName,
  ],
  [FinancialServiceProviders.commercialBankEthiopia]: [
    FinancialServiceProviderConfigurationEnum.password,
    FinancialServiceProviderConfigurationEnum.username,
    FinancialServiceProviderConfigurationEnum.displayName,
  ],
  [FinancialServiceProviders.excel]: [
    FinancialServiceProviderConfigurationEnum.columnsToExport,
    FinancialServiceProviderConfigurationEnum.columnToMatch,
    FinancialServiceProviderConfigurationEnum.displayName,
  ],
};

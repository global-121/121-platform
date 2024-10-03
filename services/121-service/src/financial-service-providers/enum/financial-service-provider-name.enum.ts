export enum FinancialServiceProviderName {
  intersolveVoucherWhatsapp = 'Intersolve-voucher-whatsapp',
  intersolveVoucherPaper = 'Intersolve-voucher-paper',
  intersolveVisa = 'Intersolve-visa',
  vodacash = 'VodaCash',
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
  FinancialServiceProviderName,
  FinancialServiceProviderConfigurationEnum[]
> = {
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

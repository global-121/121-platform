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
  fundingTokenCode = 'fundingTokenCode',
}

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

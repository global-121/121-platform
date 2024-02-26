export enum FinancialServiceProviderName {
  intersolveVoucherWhatsapp = 'Intersolve-voucher-whatsapp',
  intersolveVoucherPaper = 'Intersolve-voucher-paper',
  intersolveVisa = 'Intersolve-visa',
  intersolveJumboPhysical = 'Intersolve-jumbo-physical',
  africasTalking = 'Africas-talking',
  belcash = 'BelCash',
  vodacash = 'VodaCash',
  bobFinance = 'BoB-finance',
  ukrPoshta = 'UkrPoshta',
  safaricom = 'Safaricom',
  commercialBankEthiopia = 'Commercial-bank-ethiopia',
  //The values below are for testing purposes
  fspAllAttributes = 'FSP - all attributes',
  fspNoAttributes = 'FSP - no attributes',
  bankA = 'Bank A',
  excel = 'Excel',
}

export enum FinancialServiceProviderConfigurationEnum {
  password = 'password',
  username = 'username',
  columnsToExport = 'columnsToExport',
  columnToMatch = 'columnToMatch',
}

export const FspConfigurationMapping: { [key in FinancialServiceProviderName]?: any } = {
  [FinancialServiceProviderName.intersolveVoucherWhatsapp]: [
    FinancialServiceProviderConfigurationEnum.password,
    FinancialServiceProviderConfigurationEnum.username,
  ],
  [FinancialServiceProviderName.intersolveVoucherPaper]: [
    FinancialServiceProviderConfigurationEnum.password,
    FinancialServiceProviderConfigurationEnum.username,
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

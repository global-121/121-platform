export enum FspName {
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

export enum FspConfigurationEnum {
  password = 'password',
  username = 'username',
  columnsToExport = 'columnsToExport',
  columnToMatch = 'columnToMatch',
}

export const FspConfigurationMapping: { [key in FspName]?: any } = {
  [FspName.intersolveVoucherWhatsapp]: [
    FspConfigurationEnum.password,
    FspConfigurationEnum.username,
  ],
  [FspName.intersolveVoucherPaper]: [
    FspConfigurationEnum.password,
    FspConfigurationEnum.username,
  ],
  [FspName.commercialBankEthiopia]: [
    FspConfigurationEnum.password,
    FspConfigurationEnum.username,
  ],
  [FspName.excel]: [
    FspConfigurationEnum.columnsToExport,
    FspConfigurationEnum.columnToMatch,
  ],
};

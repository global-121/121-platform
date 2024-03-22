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
  excel = 'Excel',
  //The values below are for testing purposes
  fspAllAttributes = 'FSP - all attributes',
  fspNoAttributes = 'FSP - no attributes',
  bankA = 'Bank A',
}

export enum FspConfigurationEnum {
  password = 'password',
  username = 'username',
  columnsToExport = 'columnsToExport',
  columnToMatch = 'columnToMatch',
  brandCode = 'brandCode',
  displayName = 'displayName',
}

export const FspConfigurationMapping: { [key in FspName]?: any } = {
  [FspName.intersolveVoucherWhatsapp]: [
    FspConfigurationEnum.password,
    FspConfigurationEnum.username,
    FspConfigurationEnum.displayName,
  ],
  [FspName.intersolveVoucherPaper]: [
    FspConfigurationEnum.password,
    FspConfigurationEnum.username,
    FspConfigurationEnum.displayName,
  ],
  [FspName.intersolveVisa]: [
    FspConfigurationEnum.brandCode,
    FspConfigurationEnum.displayName,
  ],
  [FspName.intersolveJumboPhysical]: [FspConfigurationEnum.displayName],
  [FspName.africasTalking]: [FspConfigurationEnum.displayName],
  [FspName.belcash]: [FspConfigurationEnum.displayName],
  [FspName.vodacash]: [FspConfigurationEnum.displayName],
  [FspName.bobFinance]: [FspConfigurationEnum.displayName],
  [FspName.ukrPoshta]: [FspConfigurationEnum.displayName],
  [FspName.safaricom]: [FspConfigurationEnum.displayName],
  [FspName.commercialBankEthiopia]: [
    FspConfigurationEnum.password,
    FspConfigurationEnum.username,
    FspConfigurationEnum.displayName,
  ],
  [FspName.excel]: [
    FspConfigurationEnum.columnsToExport,
    FspConfigurationEnum.columnToMatch,
    FspConfigurationEnum.displayName,
  ],
  //The values below are for testing purposes
  [FspName.fspAllAttributes]: [FspConfigurationEnum.displayName],
  [FspName.fspNoAttributes]: [FspConfigurationEnum.displayName],
  [FspName.bankA]: [FspConfigurationEnum.displayName],
};

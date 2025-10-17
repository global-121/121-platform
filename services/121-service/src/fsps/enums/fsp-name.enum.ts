export enum Fsps {
  intersolveVoucherWhatsapp = 'Intersolve-voucher-whatsapp',
  intersolveVoucherPaper = 'Intersolve-voucher-paper',
  intersolveVisa = 'Intersolve-visa',
  safaricom = 'Safaricom',
  airtel = 'Airtel',
  commercialBankEthiopia = 'Commercial-bank-ethiopia',
  excel = 'Excel',
  // TODO AB#38595 remove this deprecated FSP
  deprecatedJumbo = 'Intersolve-jumbo-physical',
  nedbank = 'Nedbank',
  onafriq = 'Onafriq',
}

export enum FspConfigurationProperties {
  password = 'password',
  username = 'username',
  columnsToExport = 'columnsToExport',
  columnToMatch = 'columnToMatch',
  brandCode = 'brandCode',
  coverLetterCode = 'coverLetterCode',
  fundingTokenCode = 'fundingTokenCode',
  paymentReferencePrefix = 'paymentReferencePrefix',
  //onafriq
  corporateCodeOnafriq = 'corporateCodeOnafriq',
  passwordOnafriq = 'passwordOnafriq',
  uniqueKeyOnafriq = 'uniqueKeyOnafriq',
}

export const FspConfigPropertyValueVisibility: Record<
  FspConfigurationProperties,
  boolean
> = {
  [FspConfigurationProperties.password]: false,
  [FspConfigurationProperties.username]: false,
  [FspConfigurationProperties.columnsToExport]: true,
  [FspConfigurationProperties.columnToMatch]: true,
  [FspConfigurationProperties.brandCode]: true,
  [FspConfigurationProperties.coverLetterCode]: true,
  [FspConfigurationProperties.fundingTokenCode]: true,
  [FspConfigurationProperties.paymentReferencePrefix]: true,
  //onafriq
  [FspConfigurationProperties.corporateCodeOnafriq]: true,
  [FspConfigurationProperties.passwordOnafriq]: true,
  [FspConfigurationProperties.uniqueKeyOnafriq]: true,
};

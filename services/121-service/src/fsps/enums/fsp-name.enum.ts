export enum Fsps {
  intersolveVoucherWhatsapp = 'Intersolve-voucher-whatsapp',
  intersolveVoucherPaper = 'Intersolve-voucher-paper',
  intersolveVisa = 'Intersolve-visa',
  safaricom = 'Safaricom',
  airtel = 'Airtel',
  commercialBankEthiopia = 'Commercial-bank-ethiopia',
  excel = 'Excel',
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
};

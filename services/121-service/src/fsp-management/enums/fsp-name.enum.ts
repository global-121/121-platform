export enum Fsps {
  intersolveVoucherWhatsapp = 'Intersolve-voucher-whatsapp',
  intersolveVoucherPaper = 'Intersolve-voucher-paper',
  intersolveVisa = 'Intersolve-visa',
  safaricom = 'Safaricom',
  airtel = 'Airtel',
  cooperativeBankOfOromia = 'Cooperative-bank-of-oromia',
  commercialBankEthiopia = 'Commercial-bank-ethiopia',
  excel = 'Excel',
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
  postalCardDistribution = 'postalCardDistribution',
  //onafriq
  corporateCodeOnafriq = 'corporateCodeOnafriq',
  passwordOnafriq = 'passwordOnafriq',
  uniqueKeyOnafriq = 'uniqueKeyOnafriq',
  // Cooperative Bank of Oromia
  debitAccountNumber = 'debitAccountNumber',
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
  [FspConfigurationProperties.postalCardDistribution]: true,
  //onafriq
  [FspConfigurationProperties.corporateCodeOnafriq]: true,
  [FspConfigurationProperties.passwordOnafriq]: false,
  [FspConfigurationProperties.uniqueKeyOnafriq]: false,
  // Cooperative Bank of Oromia
  [FspConfigurationProperties.debitAccountNumber]: true,
};

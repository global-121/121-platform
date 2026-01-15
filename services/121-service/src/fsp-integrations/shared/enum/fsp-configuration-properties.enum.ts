export enum FspConfigurationProperties {
  password = 'password',
  username = 'username',
  columnsToExport = 'columnsToExport',
  columnToMatch = 'columnToMatch',
  // Intersolve Visa
  brandCode = 'brandCode',
  coverLetterCode = 'coverLetterCode',
  fundingTokenCode = 'fundingTokenCode',
  cardDistributionByMail = 'cardDistributionByMail',
  // Nedbank
  paymentReferencePrefix = 'paymentReferencePrefix',
  // Onafriq
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
  // Intersolve Visa
  [FspConfigurationProperties.brandCode]: true,
  [FspConfigurationProperties.coverLetterCode]: true,
  [FspConfigurationProperties.fundingTokenCode]: true,
  [FspConfigurationProperties.cardDistributionByMail]: true,
  // Nedbank
  [FspConfigurationProperties.paymentReferencePrefix]: true,
  // Onafriq
  [FspConfigurationProperties.corporateCodeOnafriq]: true,
  [FspConfigurationProperties.passwordOnafriq]: false,
  [FspConfigurationProperties.uniqueKeyOnafriq]: false,
  // Cooperative Bank of Oromia
  [FspConfigurationProperties.debitAccountNumber]: true,
};

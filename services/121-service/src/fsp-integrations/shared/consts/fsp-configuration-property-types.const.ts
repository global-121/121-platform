import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum.js';

export const FspConfigurationPropertyTypes = {
  [FspConfigurationProperties.password]: 'string',
  [FspConfigurationProperties.username]: 'string',
  [FspConfigurationProperties.columnsToExport]: 'string[]',
  [FspConfigurationProperties.columnToMatch]: 'string',
  // Intersolve Visa
  [FspConfigurationProperties.brandCode]: 'string',
  [FspConfigurationProperties.coverLetterCode]: 'string',
  [FspConfigurationProperties.fundingTokenCode]: 'string',
  [FspConfigurationProperties.cardDistributionByMail]: 'boolean',
  [FspConfigurationProperties.maxToSpendPerMonthInCents]: 'number',
  // Nedbank
  [FspConfigurationProperties.paymentReferencePrefix]: 'string',
  // Onafriq
  [FspConfigurationProperties.corporateCodeOnafriq]: 'string',
  [FspConfigurationProperties.passwordOnafriq]: 'string',
  [FspConfigurationProperties.uniqueKeyOnafriq]: 'string',
  // Cooperative Bank of Oromia
  [FspConfigurationProperties.debitAccountNumber]: 'string',
};

import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';

export const fspConfigurationPropertyTypes = {
  [FspConfigurationProperties.maxToSpendPerMonthInCents]: 'number',
  [FspConfigurationProperties.cardDistributionByMail]: 'boolean',
  [FspConfigurationProperties.columnsToExport]: 'array',
  [FspConfigurationProperties.columnToMatch]: 'string',
  [FspConfigurationProperties.brandCode]: 'string',
  [FspConfigurationProperties.coverLetterCode]: 'string',
  [FspConfigurationProperties.fundingTokenCode]: 'string',
  [FspConfigurationProperties.paymentReferencePrefix]: 'string',
  [FspConfigurationProperties.corporateCodeOnafriq]: 'string',
  [FspConfigurationProperties.passwordOnafriq]: 'string',
  [FspConfigurationProperties.uniqueKeyOnafriq]: 'string',
  [FspConfigurationProperties.debitAccountNumber]: 'string',
  [FspConfigurationProperties.password]: 'string',
  [FspConfigurationProperties.username]: 'string',
} as const;

// Map runtime type strings to actual TypeScript types
interface RuntimeTypeToTsType {
  string: string;
  number: number;
  boolean: boolean;
  array: string[];
}

// Derive TypeScript interface from runtime object
export type FspConfigurationPropertyTypeMap = {
  [K in keyof typeof fspConfigurationPropertyTypes]: RuntimeTypeToTsType[(typeof fspConfigurationPropertyTypes)[K]];
};

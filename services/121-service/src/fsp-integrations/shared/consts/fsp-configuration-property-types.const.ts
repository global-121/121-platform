import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';

export const fspConfigurationPropertyTypes = {
  [FspConfigurationProperties.maxBalanceInCents]: 'number',
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
  [FspConfigurationProperties.subscriptionKeyMtn]: 'string',
  [FspConfigurationProperties.referenceIdMtn]: 'string',
  [FspConfigurationProperties.apiKeyMtn]: 'string',
  [FspConfigurationProperties.accountAlfouad]: 'string',
  [FspConfigurationProperties.branchIdAlfouad]: 'string',
  [FspConfigurationProperties.usernameAlfouad]: 'string',
  [FspConfigurationProperties.passwordAlfouad]: 'string',
  [FspConfigurationProperties.publicKeyAlfouad]: 'string',
  [FspConfigurationProperties.senderFullNameAlfouad]: 'string',
  [FspConfigurationProperties.senderPhoneNumberAlfouad]: 'string',
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

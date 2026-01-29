import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';

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
  maxToSpendPerMonthInCents = 'maxToSpendPerMonthInCents',
  // Nedbank
  paymentReferencePrefix = 'paymentReferencePrefix',
  // Onafriq
  corporateCodeOnafriq = 'corporateCodeOnafriq',
  passwordOnafriq = 'passwordOnafriq',
  uniqueKeyOnafriq = 'uniqueKeyOnafriq',
  // Cooperative Bank of Oromia
  debitAccountNumber = 'debitAccountNumber',
}

interface FspConfigPropertyAttributes {
  visible: boolean;
  type: 'string' | 'string[]' | 'number' | 'boolean';
}

export const FspConfigPropertyAttributes: Record<
  FspConfigurationProperties,
  FspConfigPropertyAttributes
> = {
  [FspConfigurationProperties.password]: {
    visible: false,
    type: 'string',
  },
  [FspConfigurationProperties.username]: {
    visible: false,
    type: 'string',
  },
  [FspConfigurationProperties.columnsToExport]: {
    visible: true,
    type: 'string[]',
  },
  [FspConfigurationProperties.columnToMatch]: {
    visible: true,
    type: 'string',
  },
  // Intersolve Visa
  [FspConfigurationProperties.brandCode]: {
    visible: true,
    type: 'string',
  },
  [FspConfigurationProperties.coverLetterCode]: {
    visible: true,
    type: 'string',
  },
  [FspConfigurationProperties.fundingTokenCode]: {
    visible: true,
    type: 'string',
  },
  [FspConfigurationProperties.cardDistributionByMail]: {
    visible: true,
    type: 'boolean',
  },
  [FspConfigurationProperties.maxToSpendPerMonthInCents]: {
    visible: true,
    type: 'number',
  },
  // Nedbank
  [FspConfigurationProperties.paymentReferencePrefix]: {
    visible: true,
    type: 'string',
  },
  // Onafriq
  [FspConfigurationProperties.corporateCodeOnafriq]: {
    visible: true,
    type: 'string',
  },
  [FspConfigurationProperties.passwordOnafriq]: {
    visible: false,
    type: 'string',
  },
  [FspConfigurationProperties.uniqueKeyOnafriq]: {
    visible: false,
    type: 'string',
  },
  // Cooperative Bank of Oromia
  [FspConfigurationProperties.debitAccountNumber]: {
    visible: true,
    type: 'string',
  },
};

export const PublicFspConfigurationProperties: Partial<
  Record<Fsps, FspConfigurationProperties[]>
> = {
  [Fsps.intersolveVisa]: [FspConfigurationProperties.cardDistributionByMail],
};

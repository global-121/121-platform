import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';

export class FspConfigurationDto {
  programFspConfigurationId: number;
  [FspConfigurationProperties.maxToSpendPerMonthInCents]: number;
  [FspConfigurationProperties.cardDistributionByMail]: boolean;
  [FspConfigurationProperties.columnsToExport]: string[];
  [FspConfigurationProperties.columnToMatch]: string;
  [FspConfigurationProperties.brandCode]: string;
  [FspConfigurationProperties.coverLetterCode]: string;
  [FspConfigurationProperties.fundingTokenCode]: string;
  [FspConfigurationProperties.paymentReferencePrefix]: string;
  [FspConfigurationProperties.corporateCodeOnafriq]: string;
  [FspConfigurationProperties.passwordOnafriq]: string;
  [FspConfigurationProperties.uniqueKeyOnafriq]: string;
  [FspConfigurationProperties.debitAccountNumber]: string;
  [FspConfigurationProperties.password]: string;
  [FspConfigurationProperties.username]: string;
}

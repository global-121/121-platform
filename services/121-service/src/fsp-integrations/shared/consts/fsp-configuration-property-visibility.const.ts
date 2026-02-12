import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';

export enum FspConfigurationPropertyVisibility {
  default = 'default',
  public = 'public',
  secret = 'secret',
}

export const FspConfigurationPropertyVisibilityMap: Record<
  FspConfigurationProperties,
  FspConfigurationPropertyVisibility
> = {
  // Secret properties
  [FspConfigurationProperties.password]:
    FspConfigurationPropertyVisibility.secret,
  [FspConfigurationProperties.username]:
    FspConfigurationPropertyVisibility.secret,
  [FspConfigurationProperties.passwordOnafriq]:
    FspConfigurationPropertyVisibility.secret,
  [FspConfigurationProperties.uniqueKeyOnafriq]:
    FspConfigurationPropertyVisibility.secret,
  // Public properties
  [FspConfigurationProperties.cardDistributionByMail]:
    FspConfigurationPropertyVisibility.public,
  // Default properties
  [FspConfigurationProperties.columnsToExport]:
    FspConfigurationPropertyVisibility.default,
  [FspConfigurationProperties.columnToMatch]:
    FspConfigurationPropertyVisibility.default,
  [FspConfigurationProperties.brandCode]:
    FspConfigurationPropertyVisibility.default,
  [FspConfigurationProperties.coverLetterCode]:
    FspConfigurationPropertyVisibility.default,
  [FspConfigurationProperties.fundingTokenCode]:
    FspConfigurationPropertyVisibility.default,
  [FspConfigurationProperties.maxToSpendPerMonthInCents]:
    FspConfigurationPropertyVisibility.default,
  [FspConfigurationProperties.paymentReferencePrefix]:
    FspConfigurationPropertyVisibility.default,
  [FspConfigurationProperties.corporateCodeOnafriq]:
    FspConfigurationPropertyVisibility.default,
  [FspConfigurationProperties.debitAccountNumber]:
    FspConfigurationPropertyVisibility.default,
};

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
  [FspConfigurationProperties.passwordAlfouad]:
    FspConfigurationPropertyVisibility.secret,
  [FspConfigurationProperties.publicKeyAlfouad]:
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
  [FspConfigurationProperties.maxBalanceInCents]:
    FspConfigurationPropertyVisibility.default,
  [FspConfigurationProperties.paymentReferencePrefix]:
    FspConfigurationPropertyVisibility.default,
  [FspConfigurationProperties.corporateCodeOnafriq]:
    FspConfigurationPropertyVisibility.default,
  [FspConfigurationProperties.debitAccountNumber]:
    FspConfigurationPropertyVisibility.default,
  // MTN properties
  [FspConfigurationProperties.subscriptionKeyMtn]:
    FspConfigurationPropertyVisibility.secret,
  [FspConfigurationProperties.referenceIdMtn]:
    FspConfigurationPropertyVisibility.secret,
  [FspConfigurationProperties.apiKeyMtn]:
    FspConfigurationPropertyVisibility.secret,
  // Al Fouad properties
  [FspConfigurationProperties.accountAlfouad]:
    FspConfigurationPropertyVisibility.default,
  [FspConfigurationProperties.branchIdAlfouad]:
    FspConfigurationPropertyVisibility.default,
  [FspConfigurationProperties.usernameAlfouad]:
    FspConfigurationPropertyVisibility.default,
  [FspConfigurationProperties.senderFullNameAlfouad]:
    FspConfigurationPropertyVisibility.default,
  [FspConfigurationProperties.senderPhoneNumberAlfouad]:
    FspConfigurationPropertyVisibility.default,
};

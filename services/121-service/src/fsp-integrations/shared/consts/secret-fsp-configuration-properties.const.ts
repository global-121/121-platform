import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';

export const SecretFspConfigurationProperties: FspConfigurationProperties[] = [
  FspConfigurationProperties.password,
  FspConfigurationProperties.username,
  // Onafriq
  FspConfigurationProperties.passwordOnafriq,
  FspConfigurationProperties.uniqueKeyOnafriq,
];

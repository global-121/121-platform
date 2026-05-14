import { FspAttributes } from '@121-service/src/fsp-integrations/shared/enum/fsp-attributes.enum';
import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { FspIntegrationType } from '@121-service/src/fsp-integrations/shared/enum/fsp-integration-type.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { FspSettingsDto } from '@121-service/src/fsp-management/fsp-settings.dto';

export const MTN_SETTINGS: FspSettingsDto = {
  name: Fsps.mtn,
  integrationType: FspIntegrationType.api,
  defaultLabel: {
    en: 'MTN',
  },
  attributes: [
    {
      name: FspAttributes.phoneNumber,
      isRequired: true,
    },
  ],
  configurationProperties: [
    {
      name: FspConfigurationProperties.subscriptionKeyMtn,
      isRequired: true,
    },
    {
      name: FspConfigurationProperties.referenceIdMtn,
      isRequired: true,
    },
    {
      name: FspConfigurationProperties.apiKeyMtn,
      isRequired: true,
    },
  ],
};

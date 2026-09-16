import { FspAttributes } from '@121-service/src/fsp-integrations/shared/enum/fsp-attributes.enum';
import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { FspIntegrationType } from '@121-service/src/fsp-integrations/shared/enum/fsp-integration-type.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { FspSettingsDto } from '@121-service/src/fsp-management/fsp-settings.dto';

export const AL_FOUAD_SETTINGS: FspSettingsDto = {
  name: Fsps.alFouad,
  integrationType: FspIntegrationType.api,
  defaultLabel: {
    en: 'Al Fouad',
  },
  attributes: [
    {
      name: FspAttributes.fullName,
      isRequired: true,
    },
    {
      name: FspAttributes.phoneNumber,
      isRequired: true,
    },
  ],
  configurationProperties: [
    {
      name: FspConfigurationProperties.accountAlFouad,
      isRequired: true,
    },
    {
      name: FspConfigurationProperties.branchIdAlFouad,
      isRequired: true,
    },
    {
      name: FspConfigurationProperties.usernameAlFouad,
      isRequired: true,
    },
    {
      name: FspConfigurationProperties.passwordAlFouad,
      isRequired: true,
    },
    {
      name: FspConfigurationProperties.publicKeyAlFouad,
      isRequired: true,
    },
    {
      name: FspConfigurationProperties.senderFullNameAlFouad,
      isRequired: true,
    },
    {
      name: FspConfigurationProperties.senderPhoneNumberAlFouad,
      isRequired: true,
    },
  ],
};

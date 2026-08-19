import { FspAttributes } from '@121-service/src/fsp-integrations/shared/enum/fsp-attributes.enum';
import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { FspIntegrationType } from '@121-service/src/fsp-integrations/shared/enum/fsp-integration-type.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { FspSettingsDto } from '@121-service/src/fsp-management/fsp-settings.dto';

export const ALFOUAD_SETTINGS: FspSettingsDto = {
  name: Fsps.alfouad,
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
    {
      name: FspAttributes.addressCity,
      isRequired: true,
    },
  ],
  configurationProperties: [
    {
      name: FspConfigurationProperties.accountAlfouad,
      isRequired: true,
    },
    {
      name: FspConfigurationProperties.branchIdAlfouad,
      isRequired: true,
    },
    {
      name: FspConfigurationProperties.usernameAlfouad,
      isRequired: true,
    },
    {
      name: FspConfigurationProperties.passwordAlfouad,
      isRequired: true,
    },
    {
      name: FspConfigurationProperties.publicKeyAlfouad,
      isRequired: true,
    },
    {
      name: FspConfigurationProperties.senderFullNameAlfouad,
      isRequired: true,
    },
    {
      name: FspConfigurationProperties.senderPhoneNumberAlfouad,
      isRequired: true,
    },
  ],
};

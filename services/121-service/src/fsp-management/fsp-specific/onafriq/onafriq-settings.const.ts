import { FspAttributes } from '@121-service/src/fsp-management/enums/fsp-attributes.enum';
import { FspIntegrationType } from '@121-service/src/fsp-management/enums/fsp-integration-type.enum';
import {
  FspConfigurationProperties,
  Fsps,
} from '@121-service/src/fsp-management/enums/fsp-name.enum';
import { FspSettingsDto } from '@121-service/src/fsp-management/fsp-settings.dto';

export const ONAFRIQ_SETTINGS: FspSettingsDto = {
  name: Fsps.onafriq,
  integrationType: FspIntegrationType.api,
  defaultLabel: {
    en: 'Onafriq',
  },
  attributes: [
    {
      name: FspAttributes.phoneNumberPayment,
      isRequired: true,
    },
    {
      name: FspAttributes.firstName,
      isRequired: true,
    },
    {
      name: FspAttributes.lastName,
      isRequired: true,
    },
  ],
  configurationProperties: [
    {
      name: FspConfigurationProperties.corporateCodeOnafriq,
      isRequired: true,
    },
    {
      name: FspConfigurationProperties.passwordOnafriq,
      isRequired: true,
    },
    {
      name: FspConfigurationProperties.uniqueKeyOnafriq,
      isRequired: true,
    },
  ],
};

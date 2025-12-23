import { FspAttributes } from '@121-service/src/fsp-integrations/shared/enum/fsp-attributes.enum';
import { FspIntegrationType } from '@121-service/src/fsp-integrations/shared/enum/fsp-integration-type.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { FspSettingsDto } from '@121-service/src/fsp-management/fsp-settings.dto';

export const SAFARICOM_SETTINGS: FspSettingsDto = {
  name: Fsps.safaricom,
  integrationType: FspIntegrationType.api,
  defaultLabel: {
    en: 'Safaricom',
  },
  attributes: [
    {
      name: FspAttributes.phoneNumber,
      isRequired: true,
    },
    {
      name: FspAttributes.nationalId,
      isRequired: true,
    },
  ],
  configurationProperties: [],
};

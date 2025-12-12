import { FspAttributes } from '@121-service/src/fsp-management/enums/fsp-attributes.enum';
import { FspIntegrationType } from '@121-service/src/fsp-management/enums/fsp-integration-type.enum';
import { Fsps } from '@121-service/src/fsp-management/enums/fsp-name.enum';
import { FspUserConfigurableDto } from '@121-service/src/fsp-management/fsp-user-configurable.dto';

export const SAFARICOM_USER_CONFIGURABLE_SETTINGS: FspUserConfigurableDto = {
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

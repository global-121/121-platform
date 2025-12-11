import { FspAttributes } from '@121-service/src/fsp-management/enums/fsp-attributes.enum';
import { FspIntegrationType } from '@121-service/src/fsp-management/enums/fsp-integration-type.enum';
import { Fsps } from '@121-service/src/fsp-management/enums/fsp-name.enum';
import { FspUserConfigurableDto } from '@121-service/src/fsp-management/fsp-user-configurable.dto';

export const AIRTEL_USER_CONFIGURABLE_SETTINGS: FspUserConfigurableDto = {
  name: Fsps.airtel,
  integrationType: FspIntegrationType.api,
  defaultLabel: {
    en: 'Airtel',
  },
  attributes: [
    {
      name: FspAttributes.phoneNumber,
      isRequired: true,
    },
  ],
  configurationProperties: [],
};

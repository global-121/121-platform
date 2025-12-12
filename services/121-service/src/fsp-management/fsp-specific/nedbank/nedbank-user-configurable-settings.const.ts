import { FspAttributes } from '@121-service/src/fsp-management/enums/fsp-attributes.enum';
import { FspIntegrationType } from '@121-service/src/fsp-management/enums/fsp-integration-type.enum';
import {
  FspConfigurationProperties,
  Fsps,
} from '@121-service/src/fsp-management/enums/fsp-name.enum';
import { FspUserConfigurableDto } from '@121-service/src/fsp-management/fsp-user-configurable.dto';

export const NEDBANK_USER_CONFIGURABLE_SETTINGS: FspUserConfigurableDto = {
  name: Fsps.nedbank,
  integrationType: FspIntegrationType.api,
  defaultLabel: {
    en: 'Nedbank',
  },
  attributes: [
    {
      name: FspAttributes.phoneNumber,
      isRequired: true,
    },
  ],
  configurationProperties: [
    {
      name: FspConfigurationProperties.paymentReferencePrefix,
      isRequired: true,
    },
  ],
};

import { FspAttributes } from '@121-service/src/fsp-management/enums/fsp-attributes.enum';
import { FspIntegrationType } from '@121-service/src/fsp-management/enums/fsp-integration-type.enum';
import {
  FspConfigurationProperties,
  Fsps,
} from '@121-service/src/fsp-management/enums/fsp-name.enum';
import { FspSettingsDto } from '@121-service/src/fsp-management/fsp-settings.dto';

export const NEDBANK_SETTINGS: FspSettingsDto = {
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

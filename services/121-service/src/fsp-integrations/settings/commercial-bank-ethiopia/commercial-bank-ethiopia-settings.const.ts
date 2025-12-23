import { FspAttributes } from '@121-service/src/fsp-integrations/shared/enum/fsp-attributes.enum';
import { FspIntegrationType } from '@121-service/src/fsp-integrations/shared/enum/fsp-integration-type.enum';
import {
  FspConfigurationProperties,
  Fsps,
} from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { FspSettingsDto } from '@121-service/src/fsp-management/fsp-settings.dto';

export const COMMERCIAL_BANK_ETHIOPIA_SETTINGS: FspSettingsDto = {
  name: Fsps.commercialBankEthiopia,
  integrationType: FspIntegrationType.api,
  defaultLabel: {
    en: 'Commercial Bank of Ethiopia',
  },
  attributes: [
    {
      name: FspAttributes.bankAccountNumber,
      isRequired: true,
    },
    {
      name: FspAttributes.fullName,
      isRequired: true,
    },
  ],
  configurationProperties: [
    {
      name: FspConfigurationProperties.username,
      isRequired: true,
    },
    {
      name: FspConfigurationProperties.password,
      isRequired: true,
    },
  ],
};

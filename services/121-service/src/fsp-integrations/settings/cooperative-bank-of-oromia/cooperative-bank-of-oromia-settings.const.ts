import { FspAttributes } from '@121-service/src/fsp-integrations/shared/enum/fsp-attributes.enum';
import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { FspIntegrationType } from '@121-service/src/fsp-integrations/shared/enum/fsp-integration-type.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { FspSettingsDto } from '@121-service/src/fsp-management/fsp-settings.dto';

export const COOPERATIVE_BANK_OF_OROMIA_SETTINGS: FspSettingsDto = {
  name: Fsps.cooperativeBankOfOromia,
  integrationType: FspIntegrationType.api,
  defaultLabel: {
    en: 'Cooperative Bank of Oromia',
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
      name: FspConfigurationProperties.debitAccountNumber,
      isRequired: true,
    },
  ],
};

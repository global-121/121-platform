import { FspAttributes } from '@121-service/src/fsp-integrations/shared/enum/fsp-attributes.enum';
import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { FspIntegrationType } from '@121-service/src/fsp-integrations/shared/enum/fsp-integration-type.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { FspSettingsDto } from '@121-service/src/fsp-management/fsp-settings.dto';

export const INTERSOLVE_VOUCHER_WHATSAPP_SETTINGS: FspSettingsDto = {
  name: Fsps.intersolveVoucherWhatsapp,
  integrationType: FspIntegrationType.api,
  defaultLabel: {
    en: 'Albert Heijn voucher WhatsApp',
  },
  attributes: [
    {
      name: FspAttributes.whatsappPhoneNumber,
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

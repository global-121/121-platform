import { FspAttributes } from '@121-service/src/fsp-management/enums/fsp-attributes.enum';
import { FspIntegrationType } from '@121-service/src/fsp-management/enums/fsp-integration-type.enum';
import {
  FspConfigurationProperties,
  Fsps,
} from '@121-service/src/fsp-management/enums/fsp-name.enum';
import { FspUserConfigurableDto } from '@121-service/src/fsp-management/fsp-user-configurable.dto';

export const INTERSOLVE_VOUCHER_WHATSAPP_USER_CONFIGURABLE_SETTINGS: FspUserConfigurableDto =
  {
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

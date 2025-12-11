import { FspIntegrationType } from '@121-service/src/fsp-management/enums/fsp-integration-type.enum';
import {
  FspConfigurationProperties,
  Fsps,
} from '@121-service/src/fsp-management/enums/fsp-name.enum';
import { FspUserConfigurableDto } from '@121-service/src/fsp-management/fsp-user-configurable.dto';

export const INTERSOLVE_VOUCHER_PAPER_USER_CONFIGURABLE_SETTINGS: FspUserConfigurableDto =
  {
    name: Fsps.intersolveVoucherPaper,
    integrationType: FspIntegrationType.api,
    defaultLabel: {
      en: 'Albert Heijn voucher paper',
    },
    attributes: [],
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

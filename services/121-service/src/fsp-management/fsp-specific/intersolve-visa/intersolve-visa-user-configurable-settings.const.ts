import { FspAttributes } from '@121-service/src/fsp-management/enums/fsp-attributes.enum';
import { FspIntegrationType } from '@121-service/src/fsp-management/enums/fsp-integration-type.enum';
import {
  FspConfigurationProperties,
  Fsps,
} from '@121-service/src/fsp-management/enums/fsp-name.enum';
import { FspUserConfigurableDto } from '@121-service/src/fsp-management/fsp-user-configurable.dto';

export const INTERSOLVE_VISA_USER_CONFIGURABLE_SETTINGS: FspUserConfigurableDto =
  {
    name: Fsps.intersolveVisa,
    integrationType: FspIntegrationType.api,
    defaultLabel: {
      en: 'Visa debit card',
    },
    attributes: [
      {
        name: FspAttributes.fullName,
        isRequired: true,
      },
      {
        name: FspAttributes.addressCity,
        isRequired: true,
      },
      {
        name: FspAttributes.addressHouseNumber,
        isRequired: true,
      },
      {
        name: FspAttributes.addressHouseNumberAddition,
        isRequired: false,
      },
      {
        name: FspAttributes.addressPostalCode,
        isRequired: true,
      },
      {
        name: FspAttributes.addressStreet,
        isRequired: true,
      },
      {
        name: FspAttributes.phoneNumber,
        isRequired: true,
      },
    ],
    configurationProperties: [
      {
        name: FspConfigurationProperties.brandCode,
        isRequired: true,
      },
      {
        name: FspConfigurationProperties.coverLetterCode,
        isRequired: true,
      },
      {
        name: FspConfigurationProperties.fundingTokenCode,
        isRequired: true,
      },
    ],
  };

import { FspAttributes } from '@121-service/src/fsp-integrations/shared/enum/fsp-attributes.enum';
import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { FspIntegrationType } from '@121-service/src/fsp-integrations/shared/enum/fsp-integration-type.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { FspSettingsDto } from '@121-service/src/fsp-management/fsp-settings.dto';

export const INTERSOLVE_VISA_SETTINGS: FspSettingsDto = {
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
    {
      name: FspConfigurationProperties.cardDistributionByMail,
      isRequired: true,
    },
    {
      name: FspConfigurationProperties.maxCentsToSpendPerMonth,
      isRequired: true,
    },
  ],
};

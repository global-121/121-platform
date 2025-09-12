import { FspAttributes } from '@121-service/src/fsps/enums/fsp-attributes.enum';
import { FspIntegrationType } from '@121-service/src/fsps/enums/fsp-integration-type.enum';
import {
  FspConfigurationProperties,
  Fsps,
} from '@121-service/src/fsps/enums/fsp-name.enum';
import { FspDto } from '@121-service/src/fsps/fsp.dto';

// Attributes are the programRegistrationAttributes that are required for a regisration to have a program fsp configuration with the fsp
// Configuration properties are the program finacial service configuration properties that are required for the fsp to be able to send a payment
export const FSP_SETTINGS: FspDto[] = [
  {
    name: Fsps.excel,
    integrationType: FspIntegrationType.csv,
    defaultLabel: {
      en: 'Excel Payment Instructions',
    },
    notifyOnTransaction: false,
    attributes: [],
    configurationProperties: [
      {
        name: FspConfigurationProperties.columnsToExport,
        isRequired: false,
      },
      {
        name: FspConfigurationProperties.columnToMatch,
        isRequired: true,
      },
    ],
  },
  {
    name: Fsps.intersolveVisa,
    integrationType: FspIntegrationType.api,
    defaultLabel: {
      en: 'Visa debit card',
    },
    notifyOnTransaction: true,
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
  },
  {
    name: Fsps.intersolveVoucherWhatsapp,
    integrationType: FspIntegrationType.api,
    defaultLabel: {
      en: 'Albert Heijn voucher WhatsApp',
    },
    notifyOnTransaction: false,
    attributes: [
      {
        name: FspAttributes.whatsappPhoneNumber,
        isRequired: true,
      },
    ],
    configurationProperties: [
      {
        name: FspConfigurationProperties.password,
        isRequired: true,
      },
      {
        name: FspConfigurationProperties.username,
        isRequired: true,
      },
    ],
  },
  {
    name: Fsps.intersolveVoucherPaper,
    integrationType: FspIntegrationType.api,
    defaultLabel: {
      en: 'Albert Heijn voucher paper',
    },
    notifyOnTransaction: false,
    attributes: [],
    configurationProperties: [
      {
        name: FspConfigurationProperties.password,
        isRequired: true,
      },
      {
        name: FspConfigurationProperties.username,
        isRequired: true,
      },
    ],
  },
  {
    name: Fsps.safaricom,
    integrationType: FspIntegrationType.api,
    defaultLabel: {
      en: 'Safaricom',
    },
    notifyOnTransaction: false,
    attributes: [
      {
        name: FspAttributes.phoneNumber,
        isRequired: true,
      },
      {
        name: FspAttributes.nationalId,
        isRequired: true,
      },
    ],
    configurationProperties: [],
  },
  {
    name: Fsps.airtel,
    integrationType: FspIntegrationType.api,
    defaultLabel: {
      en: 'Airtel',
    },
    notifyOnTransaction: false,
    attributes: [
      {
        name: FspAttributes.phoneNumber,
        isRequired: true,
      },
    ],
    configurationProperties: [],
  },
  {
    name: Fsps.commercialBankEthiopia,
    integrationType: FspIntegrationType.api,
    defaultLabel: {
      en: 'Commercial Bank of Ethiopia',
    },
    notifyOnTransaction: false,
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
        name: FspConfigurationProperties.password,
        isRequired: true,
      },
      {
        name: FspConfigurationProperties.username,
        isRequired: true,
      },
    ],
  },
  {
    name: Fsps.nedbank,
    integrationType: FspIntegrationType.api,
    defaultLabel: {
      en: 'Nedbank',
    },
    notifyOnTransaction: false,
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
  },
  {
    name: Fsps.onafriq,
    integrationType: FspIntegrationType.api,
    defaultLabel: {
      en: 'Onafriq',
    },
    notifyOnTransaction: false,
    attributes: [
      {
        name: FspAttributes.phoneNumberPayment,
        isRequired: true,
      },
      {
        name: FspAttributes.firstName,
        isRequired: true,
      },
      {
        name: FspAttributes.lastName,
        isRequired: true,
      },
    ],
    configurationProperties: [],
  },
];

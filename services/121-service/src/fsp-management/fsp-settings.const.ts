import { FspAttributes } from '@121-service/src/fsp-management/enums/fsp-attributes.enum';
import { FspIntegrationType } from '@121-service/src/fsp-management/enums/fsp-integration-type.enum';
import {
  FspConfigurationProperties,
  Fsps,
} from '@121-service/src/fsp-management/enums/fsp-name.enum';
import { FspDto } from '@121-service/src/fsp-management/fsp.dto';

// Attributes are the programRegistrationAttributes that are required for a registration to have a program fsp configuration with the fsp
// Configuration properties are the program financial service configuration properties that are required for the fsp to be able to send a payment
// The order of the configuration properties define the order in which they are displayed in the UI to add/edit a program fsp configuration
export const FSP_SETTINGS: Record<Fsps, FspDto> = {
  [Fsps.excel]: {
    name: Fsps.excel,
    integrationType: FspIntegrationType.csv,
    defaultLabel: {
      en: 'Excel Payment Instructions',
    },
    attributes: [],
    configurationProperties: [
      {
        name: FspConfigurationProperties.columnToMatch,
        isRequired: true,
      },
      {
        name: FspConfigurationProperties.columnsToExport,
        isRequired: false,
      },
    ],
  },
  [Fsps.intersolveVisa]: {
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
  },
  [Fsps.intersolveVoucherWhatsapp]: {
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
  },
  [Fsps.intersolveVoucherPaper]: {
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
  },
  [Fsps.safaricom]: {
    name: Fsps.safaricom,
    integrationType: FspIntegrationType.api,
    defaultLabel: {
      en: 'Safaricom',
    },
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
  [Fsps.airtel]: {
    name: Fsps.airtel,
    integrationType: FspIntegrationType.api,
    defaultLabel: {
      en: 'Airtel',
    },
    attributes: [
      {
        name: FspAttributes.phoneNumber,
        isRequired: true,
      },
    ],
    configurationProperties: [],
  },
  [Fsps.commercialBankEthiopia]: {
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
  },
  [Fsps.nedbank]: {
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
  },
  [Fsps.onafriq]: {
    name: Fsps.onafriq,
    integrationType: FspIntegrationType.api,
    defaultLabel: {
      en: 'Onafriq',
    },
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
    configurationProperties: [
      {
        name: FspConfigurationProperties.corporateCodeOnafriq,
        isRequired: true,
      },
      {
        name: FspConfigurationProperties.passwordOnafriq,
        isRequired: true,
      },
      {
        name: FspConfigurationProperties.uniqueKeyOnafriq,
        isRequired: true,
      },
    ],
  },
  [Fsps.cooperativeBankOfOromia]: {
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
  },
};

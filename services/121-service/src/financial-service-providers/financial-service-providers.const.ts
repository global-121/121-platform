import { FinancialServiceProviderAttributes } from '@121-service/src/financial-service-providers/enum/financial-service-provider-attributes.enum';
import {
  FinancialServiceProviderConfigurationProperties,
  FinancialServiceProviders,
} from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { FinancialServiceProviderDto } from '@121-service/src/financial-service-providers/financial-service-provider.dto';
import { FinancialServiceProviderIntegrationType } from '@121-service/src/financial-service-providers/financial-service-provider-integration-type.enum';

export const FINANCIAL_SERVICE_PROVIDERS: FinancialServiceProviderDto[] = [
  {
    name: FinancialServiceProviders.excel,
    integrationType: FinancialServiceProviderIntegrationType.csv,
    defaultLabel: {
      en: 'Excel Payment Instructions',
    },
    notifyOnTransaction: false,
    attributes: [],
    configurationProperties: [
      {
        name: FinancialServiceProviderConfigurationProperties.columnsToExport,
        isRequired: false,
      },
      {
        name: FinancialServiceProviderConfigurationProperties.columnToMatch,
        isRequired: true,
      },
    ],
  },
  {
    name: 'fsp_no_attributes',
    integrationType: FinancialServiceProviderIntegrationType.api,
    defaultLabel: {
      ar: 'FSP - لا توجد سمات',
      en: 'FSP - no attributes',
      es: 'FSP - sin atributos',
      fr: 'FSP - aucun attribut',
      nl: 'FSP - geen attributen',
    },
    notifyOnTransaction: false,
    attributes: [],
    configurationProperties: [],
  },
  {
    name: FinancialServiceProviders.intersolveVoucherPaper,
    integrationType: FinancialServiceProviderIntegrationType.api,
    defaultLabel: {
      en: 'Albert Heijn voucher paper',
    },
    notifyOnTransaction: false,
    attributes: [],
    configurationProperties: [
      {
        name: FinancialServiceProviderConfigurationProperties.password,
        isRequired: true,
      },
      {
        name: FinancialServiceProviderConfigurationProperties.username,
        isRequired: true,
      },
    ],
  },
  {
    name: FinancialServiceProviders.safaricom,
    integrationType: FinancialServiceProviderIntegrationType.api,
    defaultLabel: {
      en: 'Safaricom',
    },
    notifyOnTransaction: false,
    attributes: [
      {
        name: FinancialServiceProviderAttributes.phoneNumber,
        isRequired: true,
      },
      {
        name: FinancialServiceProviderAttributes.nationalId,
        isRequired: true,
      },
    ],
    configurationProperties: [],
  },
  {
    name: 'bank_a',
    integrationType: FinancialServiceProviderIntegrationType.api,
    defaultLabel: {
      ar: 'البنك أ',
      en: 'Bank A',
      es: 'Banco A',
      fr: 'Banque A',
      nl: 'Bank A',
    },
    notifyOnTransaction: false,
    attributes: [
      {
        name: FinancialServiceProviderAttributes.nationalId,
        isRequired: true,
      },
    ],
    configurationProperties: [],
  },
  {
    name: FinancialServiceProviders.intersolveVisa,
    integrationType: FinancialServiceProviderIntegrationType.api,
    defaultLabel: {
      en: 'Visa debit card',
    },
    notifyOnTransaction: true,
    attributes: [
      {
        name: FinancialServiceProviderAttributes.fullName,
        isRequired: true,
      },
      {
        name: FinancialServiceProviderAttributes.addressCity,
        isRequired: true,
      },
      {
        name: FinancialServiceProviderAttributes.addressHouseNumber,
        isRequired: true,
      },
      {
        name: FinancialServiceProviderAttributes.addressHouseNumberAddition,
        isRequired: false,
      },
      {
        name: FinancialServiceProviderAttributes.addressPostalCode,
        isRequired: true,
      },
      {
        name: FinancialServiceProviderAttributes.addressStreet,
        isRequired: true,
      },
      {
        name: FinancialServiceProviderAttributes.phoneNumber,
        isRequired: true,
      },
    ],
    configurationProperties: [
      {
        name: FinancialServiceProviderConfigurationProperties.brandCode,
        isRequired: true,
      },
      {
        name: FinancialServiceProviderConfigurationProperties.coverLetterCode,
        isRequired: true,
      },
      {
        name: FinancialServiceProviderConfigurationProperties.fundingTokenCode,
        isRequired: true,
      },
    ],
  },
  {
    name: FinancialServiceProviders.commercialBankEthiopia,
    integrationType: FinancialServiceProviderIntegrationType.api,
    defaultLabel: {
      en: 'Commercial Bank of Ethiopia',
    },
    notifyOnTransaction: false,
    attributes: [
      {
        name: FinancialServiceProviderAttributes.bankAccountNumber,
        isRequired: true,
      },
    ],
    configurationProperties: [
      {
        name: FinancialServiceProviderConfigurationProperties.password,
        isRequired: true,
      },
      {
        name: FinancialServiceProviderConfigurationProperties.username,
        isRequired: true,
      },
    ],
  },
  {
    name: FinancialServiceProviders.intersolveVoucherWhatsapp,
    integrationType: FinancialServiceProviderIntegrationType.api,
    defaultLabel: {
      en: 'Albert Heijn voucher WhatsApp',
    },
    notifyOnTransaction: false,
    attributes: [
      {
        name: FinancialServiceProviderAttributes.whatsappPhoneNumber,
        isRequired: true,
      },
    ],
    configurationProperties: [
      {
        name: FinancialServiceProviderConfigurationProperties.password,
        isRequired: true,
      },
      {
        name: FinancialServiceProviderConfigurationProperties.username,
        isRequired: true,
      },
    ],
  },
];

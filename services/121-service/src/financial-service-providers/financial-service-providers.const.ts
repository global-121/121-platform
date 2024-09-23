import { FinancialServiceProviders } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { FinancialServiceProviderDto } from '@121-service/src/financial-service-providers/financial-service-provider.dto';
import { FinancialServiceProviderIntegrationType } from '@121-service/src/financial-service-providers/financial-service-provider-integration-type.enum';

export const FINANCIAL_SERVICE_PROVIDERS: FinancialServiceProviderDto[] = [
  {
    name: FinancialServiceProviders.excel,
    integrationType: FinancialServiceProviderIntegrationType.csv,
    hasReconciliation: false,
    defaultLabel: {
      en: 'Excel Payment Instructions',
    },
    notifyOnTransaction: false,
    attributes: [],
  },
  {
    name: 'fsp_no_attributes',
    integrationType: FinancialServiceProviderIntegrationType.api,
    hasReconciliation: false,
    defaultLabel: {
      ar: 'FSP - لا توجد سمات',
      en: 'FSP - no attributes',
      es: 'FSP - sin atributos',
      fr: 'FSP - aucun attribut',
      nl: 'FSP - geen attributen',
    },
    notifyOnTransaction: false,
    attributes: [],
  },
  {
    name: FinancialServiceProviders.intersolveVoucherPaper,
    integrationType: FinancialServiceProviderIntegrationType.api,
    hasReconciliation: false,
    defaultLabel: {
      en: 'Albert Heijn voucher paper',
    },
    notifyOnTransaction: false,
    attributes: [],
  },
  {
    name: FinancialServiceProviders.safaricom,
    integrationType: FinancialServiceProviderIntegrationType.api,
    hasReconciliation: false,
    defaultLabel: {
      en: 'Safaricom',
    },
    notifyOnTransaction: false,
    attributes: [
      {
        name: 'phoneNumber',
        isRequired: true,
      },
    ],
  },
  {
    name: FinancialServiceProviders.vodacash,
    integrationType: FinancialServiceProviderIntegrationType.xml,
    hasReconciliation: false,
    defaultLabel: {
      en: 'Vodacash',
    },
    notifyOnTransaction: false,
    attributes: [
      {
        name: 'phoneNumber',
        isRequired: true,
      },
      {
        name: 'healthArea',
        isRequired: true,
      },
    ],
  },
  {
    name: 'bank_a',
    integrationType: FinancialServiceProviderIntegrationType.api,
    hasReconciliation: false,
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
        name: 'personalId',
        isRequired: true,
      },
    ],
  },
  {
    name: FinancialServiceProviders.intersolveVisa,
    integrationType: FinancialServiceProviderIntegrationType.api,
    hasReconciliation: false,
    defaultLabel: {
      en: 'Visa debit card',
    },
    notifyOnTransaction: true,
    attributes: [
      {
        name: 'fullName',
        isRequired: true,
      },
      {
        name: 'addressStreet',
        isRequired: true,
      },
      {
        name: 'addressHouseNumber',
        isRequired: true,
      },
      {
        name: 'addressHouseNumberAddition',
        isRequired: false,
      },
      {
        name: 'addressPostalCode',
        isRequired: true,
      },
      {
        name: 'addressCity',
        isRequired: true,
      },
      {
        name: 'phoneNumber',
        isRequired: true,
      },
    ],
  },
  {
    name: 'fsp_all_attributes',
    integrationType: FinancialServiceProviderIntegrationType.api,
    hasReconciliation: false,

    defaultLabel: {
      ar: 'FSP - جميع الصفات',
      en: 'FSP - all attributes',
      es: 'FSP - todos los atributos',
      fr: 'FSP - tous les attribut',
      nl: 'FSP - alle attributen',
    },
    notifyOnTransaction: false,
    attributes: [
      {
        name: 'phoneNumber',
        isRequired: true,
      },
      {
        name: 'accountId',
        isRequired: true,
      },
      {
        name: 'date',
        isRequired: true,
      },
      {
        name: 'openAnswer',
        isRequired: true,
      },
      {
        name: 'fixedChoice',
        isRequired: true,
      },
    ],
  },
  {
    name: FinancialServiceProviders.commercialBankEthiopia,
    integrationType: FinancialServiceProviderIntegrationType.api,
    hasReconciliation: false,
    defaultLabel: {
      en: 'Commercial Bank of Ethiopia',
    },
    notifyOnTransaction: false,
    attributes: [
      {
        name: 'bankAccountNumber',
        isRequired: true,
      },
    ],
  },
  {
    name: FinancialServiceProviders.intersolveVoucherWhatsapp,
    integrationType: FinancialServiceProviderIntegrationType.api,
    hasReconciliation: false,
    defaultLabel: {
      en: 'Albert Heijn voucher WhatsApp',
    },
    notifyOnTransaction: false,
    attributes: [
      {
        name: 'whatsappPhoneNumber',
        isRequired: true,
      },
    ],
  },
];
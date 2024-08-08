import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { FinancialServiceProviderIntegrationType } from '@121-service/src/programs/fsp-configuration/financial-service-provider-integration-type.enum';
import { FinancialServiceProvider } from '@121-service/src/programs/fsp-configuration/financial-service-provider.interface';

export const FINANCIAL_SERIVCE_PROVIDERS: FinancialServiceProvider[] = [
  {
    name: FinancialServiceProviderName.excel,
    integrationType: FinancialServiceProviderIntegrationType.csv,
    hasReconciliation: false,
    deliveryMechanisms: [
      {
        name: 'Excel',
        type: 'mobileMoney',
        defaultLabel: {
          en: 'Excel Payment Instructions',
        },
        notifyOnTransaction: false,
        attributes: [],
      },
    ],
  },
  {
    name: FinancialServiceProviderName.belcash,
    integrationType: FinancialServiceProviderIntegrationType.api,
    hasReconciliation: false,
    deliveryMechanisms: [
      {
        name: 'BelCash',
        type: 'mobileMoney',
        defaultLabel: {
          en: 'BelCash',
        },
        notifyOnTransaction: false,
        attributes: [
          {
            name: 'phoneNumber',
            required: true,
          },
          {
            name: 'typePhoneNumber',
            required: true,
          },
        ],
      },
    ],
  },
  {
    name: 'fsp_no_attributes',
    integrationType: FinancialServiceProviderIntegrationType.api,
    hasReconciliation: false,
    deliveryMechanisms: [
      {
        name: 'fsp_no_attributes',
        type: 'mobileMoney',
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
    ],
  },
  {
    name: FinancialServiceProviderName.intersolveVoucherPaper,
    integrationType: FinancialServiceProviderIntegrationType.api,
    hasReconciliation: false,
    deliveryMechanisms: [
      {
        name: 'Intersolve-voucher-paper',
        type: 'mobileMoney',
        defaultLabel: {
          en: 'Albert Heijn voucher paper',
        },
        notifyOnTransaction: false,
        attributes: [],
      },
    ],
  },
  {
    name: FinancialServiceProviderName.safaricom,
    integrationType: FinancialServiceProviderIntegrationType.api,
    hasReconciliation: false,
    deliveryMechanisms: [
      {
        name: 'Safaricom',
        type: 'mobileMoney',
        defaultLabel: {
          en: 'Safaricom',
        },
        notifyOnTransaction: false,
        attributes: [
          {
            name: 'phoneNumber',
            required: true,
          },
        ],
      },
    ],
  },
  {
    name: FinancialServiceProviderName.vodacash,
    integrationType: FinancialServiceProviderIntegrationType.xml,
    hasReconciliation: false,
    deliveryMechanisms: [
      {
        name: 'VodaCash',
        type: 'mobileMoney',
        defaultLabel: {
          en: 'Vodacash',
        },
        notifyOnTransaction: false,
        attributes: [
          {
            name: 'phoneNumber',
            required: true,
          },
          {
            name: 'healthArea',
            required: true,
          },
        ],
      },
    ],
  },
  {
    name: FinancialServiceProviderName.bobFinance,
    integrationType: FinancialServiceProviderIntegrationType.csv,
    hasReconciliation: false,
    deliveryMechanisms: [
      {
        name: 'BoB-finance',
        type: 'mobileMoney',
        defaultLabel: {
          en: 'BoB Finance',
        },
        notifyOnTransaction: false,
        attributes: [
          {
            name: 'phoneNumber',
            required: true,
          },
          {
            name: 'nameFirst',
            required: true,
          },
          {
            name: 'nameLast',
            required: true,
          },
        ],
      },
    ],
  },
  {
    name: 'bank_a',
    integrationType: FinancialServiceProviderIntegrationType.api,
    hasReconciliation: false,
    deliveryMechanisms: [
      {
        name: 'bank_a',
        type: 'mobileMoney',
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
            required: true,
          },
        ],
      },
    ],
  },
  {
    name: FinancialServiceProviderName.intersolveVisa,
    integrationType: FinancialServiceProviderIntegrationType.api,
    hasReconciliation: false,
    deliveryMechanisms: [
      {
        name: 'Intersolve-visa',
        type: 'mobileMoney',
        defaultLabel: {
          en: 'Visa debit card',
        },
        notifyOnTransaction: true,
        attributes: [
          {
            name: 'addressStreet',
            required: true,
          },
          {
            name: 'addressHouseNumber',
            required: true,
          },
          {
            name: 'addressHouseNumberAddition',
            required: true,
          },
          {
            name: 'addressPostalCode',
            required: true,
          },
          {
            name: 'addressCity',
            required: true,
          },
          {
            name: 'whatsappPhoneNumber',
            required: true,
          },
        ],
      },
    ],
  },
  {
    name: 'fsp_all_attributes',
    integrationType: FinancialServiceProviderIntegrationType.api,
    hasReconciliation: false,
    deliveryMechanisms: [
      {
        name: 'fsp_all_attributes',
        type: 'mobileMoney',
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
            required: true,
          },
          {
            name: 'accountId',
            required: true,
          },
          {
            name: 'date',
            required: true,
          },
          {
            name: 'openAnswer',
            required: true,
          },
          {
            name: 'fixedChoice',
            required: true,
          },
        ],
      },
    ],
  },
  {
    name: FinancialServiceProviderName.africasTalking,
    integrationType: FinancialServiceProviderIntegrationType.api,
    hasReconciliation: false,
    deliveryMechanisms: [
      {
        name: 'Africas-talking',
        type: 'mobileMoney',
        defaultLabel: {
          en: 'Africas-talking',
        },
        notifyOnTransaction: false,
        attributes: [
          {
            name: 'phoneNumber',
            required: true,
          },
        ],
      },
    ],
  },
  {
    name: FinancialServiceProviderName.commercialBankEthiopia,
    integrationType: FinancialServiceProviderIntegrationType.api,
    hasReconciliation: false,
    deliveryMechanisms: [
      {
        name: 'Commercial-bank-ethiopia',
        type: 'mobileMoney',
        defaultLabel: {
          en: 'Commercial Bank of Ethiopia',
        },
        notifyOnTransaction: false,
        attributes: [
          {
            name: 'bankAccountNumber',
            required: true,
          },
        ],
      },
    ],
  },
  {
    name: FinancialServiceProviderName.ukrPoshta,
    integrationType: FinancialServiceProviderIntegrationType.csv,
    hasReconciliation: false,
    deliveryMechanisms: [
      {
        name: 'UkrPoshta',
        type: 'mobileMoney',
        defaultLabel: {
          en: 'UkrPoshta',
        },
        notifyOnTransaction: false,
        attributes: [
          {
            name: 'oblast',
            required: true,
          },
          {
            name: 'raion',
            required: true,
          },
          {
            name: 'street',
            required: true,
          },
          {
            name: 'house',
            required: true,
          },
          {
            name: 'apartmentOrOffice',
            required: true,
          },
          {
            name: 'postalIndex',
            required: true,
          },
          {
            name: 'city',
            required: true,
          },
          {
            name: 'lastName',
            required: true,
          },
          {
            name: 'firstName',
            required: true,
          },
          {
            name: 'fathersName',
            required: true,
          },
          {
            name: 'taxId',
            required: true,
          },
          {
            name: 'telephone',
            required: true,
          },
        ],
      },
    ],
  },
  {
    name: FinancialServiceProviderName.intersolveVoucherWhatsapp,
    integrationType: FinancialServiceProviderIntegrationType.api,
    hasReconciliation: false,
    deliveryMechanisms: [
      {
        name: 'Intersolve-voucher-whatsapp',
        type: 'mobileMoney',
        defaultLabel: {
          en: 'Albert Heijn voucher WhatsApp',
        },
        notifyOnTransaction: false,
        attributes: [
          {
            name: 'whatsappPhoneNumber',
            required: true,
          },
        ],
      },
    ],
  },
  {
    name: FinancialServiceProviderName.intersolveJumboPhysical,
    integrationType: FinancialServiceProviderIntegrationType.api,
    hasReconciliation: false,
    deliveryMechanisms: [
      {
        name: 'Intersolve-jumbo-physical',
        type: 'mobileMoney',
        defaultLabel: {
          en: 'Jumbo card',
        },
        notifyOnTransaction: true,
        attributes: [
          {
            name: 'addressStreet',
            required: true,
          },
          {
            name: 'addressHouseNumber',
            required: true,
          },
          {
            name: 'addressHouseNumberAddition',
            required: true,
          },
          {
            name: 'addressPostalCode',
            required: true,
          },
          {
            name: 'addressCity',
            required: true,
          },
          {
            name: 'whatsappPhoneNumber',
            required: true,
          },
        ],
      },
    ],
  },
];

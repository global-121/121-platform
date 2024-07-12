import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { FinancialServiceProviderIntegrationType } from '@121-service/src/program-financial-service-provider-configurations/financial-service-provider-integration-type.enum';
import { FinancialServiceProvider } from '@121-service/src/program-financial-service-provider-configurations/financial-service-provider.interface';

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
];

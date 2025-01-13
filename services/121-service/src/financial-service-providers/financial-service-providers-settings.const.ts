import { FinancialServiceProviderAttributes } from '@121-service/src/financial-service-providers/enum/financial-service-provider-attributes.enum';
import {
  FinancialServiceProviderConfigurationProperties,
  FinancialServiceProviders,
} from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { FinancialServiceProviderDto } from '@121-service/src/financial-service-providers/financial-service-provider.dto';
import { FinancialServiceProviderIntegrationType } from '@121-service/src/financial-service-providers/financial-service-provider-integration-type.enum';

// Attributes are the programRegistrationAttributes that are required for a regisration to have a program financial service provider configuration with the financial service provider
// Configuration properties are the program finacial service configuration properties that are required for the financial service provider to be able to send a payment
export const FINANCIAL_SERVICE_PROVIDER_SETTINGS: FinancialServiceProviderDto[] =
  [
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
      name: FinancialServiceProviders.deprecatedJumbo, // This financial service provider is deprecated. However there are still transactions that exists for this FSP in running program. Therefore this is needed as a work around
      integrationType: FinancialServiceProviderIntegrationType.api,
      defaultLabel: {
        en: 'JUMBO deprecated',
      },
      notifyOnTransaction: false,
      attributes: [],
      configurationProperties: [],
    },
    {
      name: FinancialServiceProviders.nedbank,
      integrationType: FinancialServiceProviderIntegrationType.api,
      defaultLabel: {
        en: 'Nedbank',
      },
      notifyOnTransaction: false,
      attributes: [
        {
          name: FinancialServiceProviderAttributes.phoneNumber,
          isRequired: true,
        },
      ],
      configurationProperties: [],
    },
  ];

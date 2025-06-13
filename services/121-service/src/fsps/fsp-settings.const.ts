import { FinancialServiceProviderAttributes } from '@121-service/src/fsps/enums/fsp-attributes.enum';
import {
  FspConfigurationProperties,
  Fsps,
} from '@121-service/src/fsps/enums/fsp-name.enum';
import { FinancialServiceProviderDto } from '@121-service/src/fsps/fsp.dto';
import { FinancialServiceProviderIntegrationType } from '@121-service/src/fsps/fsp-integration-type.enum';

// Attributes are the programRegistrationAttributes that are required for a regisration to have a program financial service provider configuration with the financial service provider
// Configuration properties are the program finacial service configuration properties that are required for the financial service provider to be able to send a payment
export const FINANCIAL_SERVICE_PROVIDER_SETTINGS: FinancialServiceProviderDto[] =
  [
    {
      name: Fsps.excel,
      integrationType: FinancialServiceProviderIntegrationType.csv,
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
      integrationType: FinancialServiceProviderIntegrationType.api,
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
      name: Fsps.commercialBankEthiopia,
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
      configurationProperties: [
        {
          name: FspConfigurationProperties.paymentReferencePrefix,
          isRequired: true,
        },
      ],
    },
  ];

import { FinancialServiceProviderAttributes } from '@121-service/src/financial-service-providers/enum/financial-service-provider-attributes.enum';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';

export const FINANCIAL_SERVICE_PROVIDER_ATTRIBUTE_TYPE_MAPPING: Record<
  FinancialServiceProviderAttributes,
  RegistrationAttributeTypes
> = {
  [FinancialServiceProviderAttributes.phoneNumber]:
    RegistrationAttributeTypes.tel,
  [FinancialServiceProviderAttributes.nationalId]:
    RegistrationAttributeTypes.text,
  [FinancialServiceProviderAttributes.fullName]:
    RegistrationAttributeTypes.text,
  [FinancialServiceProviderAttributes.addressStreet]:
    RegistrationAttributeTypes.text,
  [FinancialServiceProviderAttributes.addressHouseNumber]:
    RegistrationAttributeTypes.numeric,
  [FinancialServiceProviderAttributes.addressHouseNumberAddition]:
    RegistrationAttributeTypes.text,
  [FinancialServiceProviderAttributes.addressPostalCode]:
    RegistrationAttributeTypes.text,
  [FinancialServiceProviderAttributes.addressCity]:
    RegistrationAttributeTypes.text,
  [FinancialServiceProviderAttributes.bankAccountNumber]:
    RegistrationAttributeTypes.text,
  [FinancialServiceProviderAttributes.whatsappPhoneNumber]:
    RegistrationAttributeTypes.tel,
};

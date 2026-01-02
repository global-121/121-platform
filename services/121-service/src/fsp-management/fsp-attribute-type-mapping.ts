import { FspAttributes } from '@121-service/src/fsp-integrations/shared/enum/fsp-attributes.enum';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';

export const FINANCIAL_SERVICE_PROVIDER_ATTRIBUTE_TYPE_MAPPING: Record<
  FspAttributes,
  RegistrationAttributeTypes
> = {
  [FspAttributes.phoneNumber]: RegistrationAttributeTypes.tel,
  [FspAttributes.nationalId]: RegistrationAttributeTypes.text,
  [FspAttributes.fullName]: RegistrationAttributeTypes.text,
  [FspAttributes.addressStreet]: RegistrationAttributeTypes.text,
  [FspAttributes.addressHouseNumber]: RegistrationAttributeTypes.numeric,
  [FspAttributes.addressHouseNumberAddition]: RegistrationAttributeTypes.text,
  [FspAttributes.addressPostalCode]: RegistrationAttributeTypes.text,
  [FspAttributes.addressCity]: RegistrationAttributeTypes.text,
  [FspAttributes.bankAccountNumber]: RegistrationAttributeTypes.text,
  [FspAttributes.whatsappPhoneNumber]: RegistrationAttributeTypes.tel,
  [FspAttributes.firstName]: RegistrationAttributeTypes.text,
  [FspAttributes.lastName]: RegistrationAttributeTypes.text,
  [FspAttributes.phoneNumberPayment]: RegistrationAttributeTypes.tel,
};

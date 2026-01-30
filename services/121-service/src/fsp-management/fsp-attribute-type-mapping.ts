import { FspAttributes } from '@121-service/src/fsp-integrations/shared/enum/fsp-attributes.enum';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';

const { numeric, text, tel } = RegistrationAttributeTypes;
export const FINANCIAL_SERVICE_PROVIDER_ATTRIBUTE_TYPE_MAPPING: Record<
  FspAttributes,
  RegistrationAttributeTypes
> = {
  [FspAttributes.addressCity]: text,
  [FspAttributes.addressHouseNumber]: numeric,
  [FspAttributes.addressHouseNumberAddition]: text,
  [FspAttributes.addressPostalCode]: text,
  [FspAttributes.addressStreet]: text,
  [FspAttributes.bankAccountNumber]: text,
  [FspAttributes.firstName]: text,
  [FspAttributes.fullName]: text,
  [FspAttributes.lastName]: text,
  [FspAttributes.nationalId]: text,
  [FspAttributes.phoneNumber]: tel,
  [FspAttributes.phoneNumberPayment]: tel,
  [FspAttributes.whatsappPhoneNumber]: tel,
};

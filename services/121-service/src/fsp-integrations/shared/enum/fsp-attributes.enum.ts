import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';

export enum FspAttributes {
  phoneNumber = 'phoneNumber',
  nationalId = 'nationalId',
  fullName = 'fullName',
  firstName = 'firstName',
  lastName = 'lastName',
  addressStreet = 'addressStreet',
  addressHouseNumber = 'addressHouseNumber',
  addressHouseNumberAddition = 'addressHouseNumberAddition',
  addressPostalCode = 'addressPostalCode',
  addressCity = 'addressCity',
  bankAccountNumber = 'bankAccountNumber',
  whatsappPhoneNumber = 'whatsappPhoneNumber',
  phoneNumberPayment = 'phoneNumberPayment',
}

export const FSP_ATTRIBUTE_TYPE_MAPPING = {
  [FspAttributes.phoneNumber]: RegistrationAttributeTypes.text,
  [FspAttributes.nationalId]: RegistrationAttributeTypes.text,
  [FspAttributes.fullName]: RegistrationAttributeTypes.text,
  [FspAttributes.firstName]: RegistrationAttributeTypes.text,
  [FspAttributes.lastName]: RegistrationAttributeTypes.text,
  [FspAttributes.addressStreet]: RegistrationAttributeTypes.text,
  [FspAttributes.addressHouseNumber]: RegistrationAttributeTypes.numeric,
  [FspAttributes.addressHouseNumberAddition]: RegistrationAttributeTypes.text,
  [FspAttributes.addressPostalCode]: RegistrationAttributeTypes.text,
  [FspAttributes.addressCity]: RegistrationAttributeTypes.text,
  [FspAttributes.bankAccountNumber]: RegistrationAttributeTypes.text,
  [FspAttributes.whatsappPhoneNumber]: RegistrationAttributeTypes.text,
  [FspAttributes.phoneNumberPayment]: RegistrationAttributeTypes.text,
} as const;

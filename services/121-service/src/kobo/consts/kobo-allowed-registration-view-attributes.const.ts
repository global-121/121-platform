import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationViewAttributeName } from '@121-service/src/shared/const';

const { numeric, text } = RegistrationAttributeTypes;

// Mapping of registration view attribute names that are ALLOWED to be filled from Kobo survey data
// Attributes NOT in this mapping are auto-generated and forbidden from Kobo
// Type-safe: keys must be valid RegistrationViewAttributeName, but not all are required
export const KOBO_ALLOWED_REGISTRATION_VIEW_ATTRIBUTES: Partial<
  Record<RegistrationViewAttributeName, RegistrationAttributeTypes>
> = {
  referenceId: text,
  preferredLanguage: text,
  paymentAmountMultiplier: numeric,
  maxPayments: numeric,
  programFspConfigurationName: text,
};

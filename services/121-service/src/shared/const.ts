import { RegistrationViewEntity } from '@121-service/src/registration/entities/registration-view.entity';

const formatArray = (array: string[]): string => {
  return array
    .map((item, index) => {
      if (index === array.length - 1) {
        return `'${item}'`;
      }
      return `'${item}',`;
    })
    .join(' ');
};

// All properties from RegistrationViewEntity (including relations and arrays)
export type RegistrationViewAttributeName = keyof RegistrationViewEntity;

// All registration view attribute names, exhaustively, except for `phoneNumber`
export type RegistrationViewAttributeNameWithoutPhoneNumber = Exclude<
  RegistrationViewAttributeName,
  'phoneNumber'
>;

const registrationViewAttributeNamesRecord: Record<
  RegistrationViewAttributeNameWithoutPhoneNumber,
  true
> = {
  id: true,
  status: true,
  referenceId: true,
  preferredLanguage: true,
  inclusionScore: true,
  paymentAmountMultiplier: true,
  registrationProgramId: true,
  maxPayments: true,
  paymentCount: true,
  paymentCountRemaining: true,
  programId: true,
  created: true,
  fspName: true,
  programFspConfigurationId: true,
  programFspConfigurationName: true,
  programFspConfigurationLabel: true,
  personAffectedSequence: true,
  lastMessageStatus: true,
  scope: true,
  duplicateStatus: true,
  program: true,
  data: true,
  dataSearchBy: true,
  transactions: true,
};

const registrationViewAttributeNamesTyped = Object.keys(
  registrationViewAttributeNamesRecord,
) as RegistrationViewAttributeNameWithoutPhoneNumber[];

// Export the typed array for type safety
export { registrationViewAttributeNamesTyped };

// Export as string array for runtime checks
export const registrationViewAttributeNames: readonly string[] =
  registrationViewAttributeNamesTyped;

export const RegistrationViewAttributeNamesFormatted = formatArray(
  registrationViewAttributeNamesTyped,
);

//To avoid endpoint confusion in registration.controller
const referenceIdConstraintArray = ['status'];
export const ReferenceIdConstraints = formatArray(referenceIdConstraintArray);

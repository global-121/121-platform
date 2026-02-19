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

// All registration view attribute names, exhaustively, except for `phoneNumber`
export type RegistrationViewAttributeNameWithoutPhoneNumber = Exclude<
  keyof RegistrationViewEntity,
  'phoneNumber'
>;

// The reason this is a Record<> is to ensure type-safety: all keys must be present, so if we add a new attribute to RegistrationViewEntity, we will get a type error until we explicitly decide whether to allow it from Kobo or not (by adding it to this record or not)
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

// Export as string array for runtime checks
export const registrationViewAttributeNames: readonly string[] = Object.keys(
  registrationViewAttributeNamesRecord,
);

//To avoid endpoint confusion in registration.controller
const referenceIdConstraintArray = ['status'];
export const ReferenceIdConstraints = formatArray(referenceIdConstraintArray);

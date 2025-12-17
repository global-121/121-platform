import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';

export interface ValidatedRegistrationInput extends RegistrationEntityProperties {
  programFspConfigurationName?: string;
  data: Record<string, string | number | boolean | null>;
}

// Had to use a type here for using Pick
type RegistrationEntityProperties = Partial<
  Pick<
    InstanceType<typeof RegistrationEntity>,
    | 'programId'
    | 'registrationStatus'
    | 'referenceId'
    | 'phoneNumber'
    | 'preferredLanguage'
    | 'inclusionScore'
    | 'paymentAmountMultiplier'
    | 'maxPayments'
    | 'scope'
  >
>;

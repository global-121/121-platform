import { RegistrationEntity } from '@121-service/src/registration/registration.entity';

export interface ValidatedRegistrationInput
  extends RegistrationEntityProperties {
  projectFspConfigurationName?: string;
  data: Record<string, string | number | boolean | null>;
}

// Had to use a type here for using Pick
type RegistrationEntityProperties = Partial<
  Pick<
    InstanceType<typeof RegistrationEntity>,
    | 'projectId'
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

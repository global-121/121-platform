import { RegistrationEntity } from '../../registration/registration.entity';

type FinancialAttributes = Array<keyof RegistrationEntity>;
export const FinancialAttributes: FinancialAttributes = [
  'paymentAmountMultiplier',
  'maxPayments',
];

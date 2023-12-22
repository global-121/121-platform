import { RegistrationEntity } from '../../registration/registration.entity';

type FinancialAttributes = (keyof RegistrationEntity)[];
export const FinancialAttributes: FinancialAttributes = [
  'paymentAmountMultiplier',
  'maxPayments',
];

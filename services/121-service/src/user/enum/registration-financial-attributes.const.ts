import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';

type FinancialAttributes = (keyof RegistrationEntity)[];
export const FinancialAttributes: FinancialAttributes = [
  'paymentAmountMultiplier',
  'maxPayments',
];

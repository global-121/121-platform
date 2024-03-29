import { PaymentRowDetail } from './payment.model';
import { Person } from './person.model';
import { Program } from './program.model';

export class RegistrationActivity {
  type: RegistrationActivityType;
  label?: string;
  date: Date;
  paymentRowDetail?: PaymentRowDetail;
  description?: string | object;
  hasVoucherSupport?: boolean;
  person?: Person;
  program?: Program;
  hasError?: boolean;
  hasWaiting?: boolean;
  user?: string;
  subLabel?: string;
  activityStatus?: string;
  messageErrorCode?: string;
}

export enum RegistrationActivityType {
  changeData = 'dataChanges',
  payment = 'payment',
  message = 'message',
  note = 'notes',
  status = 'status',
}

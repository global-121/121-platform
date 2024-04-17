import Permission from '../auth/permission.enum';
import FspName from '../enums/fsp-name.enum';
import RegistrationStatus from '../enums/registration-status.enum';
import { ProgramPhase } from './program.model';
import { TranslatableString } from './translatable-string.model';

// Model for data from the API
export class Person {
  id: number;
  referenceId: string;
  programId: number;
  phoneNumber?: string;
  inclusionScore?: number;
  name?: string;
  registrationCreated?: string;
  status: RegistrationStatus;
  note?: string;
  financialServiceProvider?: FspName;
  fspDisplayName?: string | TranslatableString;
  paymentAmountMultiplier?: number;
  maxPayments?: number;
  preferredLanguage?: LanguageEnum;
  registrationProgramId: number;
  personAffectedSequence: string;
  lastTransactionPaymentNumber?: number;
  paymentCount?: number;
  paymentCountRemaining?: number;
  lastTransactionCreated?: string;
  lastTransactionAmount?: number;
  lastTransactionStatus?: string;
  lastTransactionErrorMessage?: string;
  lastMessageStatus?: string;
  lastMessageType?: string;
  scope?: string;
}

// Model for display (in table)
export class PersonRow {
  id: number;
  referenceId: string;
  checkboxVisible: boolean;
  checkboxDisabled?: boolean = false;
  registrationProgramId: string; // Display label
  registrationStatus: RegistrationStatus; // Not displayed in table, but needed e.g. for updateCheckboxes
  status: string;
  hasNote: boolean;
  registrationCreated?: string;
  inclusionScore?: number;
  name?: string | null;
  phoneNumber?: string | null;
  fsp?: FspName;
  financialServiceProvider?: string | null;
  paymentAmountMultiplier?: string | null;
  maxPayments?: string | null;
  paymentCount?: number;
  paymentCountRemaining?: number | null;
  preferredLanguage?: string | null;
  paymentHistoryColumn?: string;
  lastMessageStatus?: string;
}

export class Note {
  public id: string;
  public created: string;
  public text: string;
  public username: string;
}

export enum LanguageEnum {
  ar = 'ar',
  en = 'en',
  es = 'es',
  fr = 'fr',
  in = 'in',
  nl = 'nl',
  ptBR = 'pt_BR',
  tl = 'tl',
  tr = 'tr',
}

export class PersonTableColumn {
  prop: string;
  name: string;
  draggable: boolean;
  resizeable: boolean;
  sortable: boolean;
  frozenLeft: boolean;
  comparator?: any;
  phases: ProgramPhase[];
  permissions: Permission[];
  showIfNoValidation: boolean;
  headerClass: string;
  minWidth?: number;
  width?: number;
}

export const PA_STATUS_ORDER = [
  { id: 2, value: RegistrationStatus.registered },
  { id: 3, value: RegistrationStatus.validated },
  { id: 4, value: RegistrationStatus.included },
  { id: 6, value: RegistrationStatus.declined },
  { id: 8, value: RegistrationStatus.paused },
  { id: 9, value: RegistrationStatus.completed },
];

export enum PersonDefaultAttributes {
  paymentAmountMultiplier = 'paymentAmountMultiplier',
  phoneNumber = 'phoneNumber',
  maxPayments = 'maxPayments',
}

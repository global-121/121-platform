import Permission from '../auth/permission.enum';
import RegistrationStatus from '../enums/registration-status.enum';
import { ProgramPhase } from './program.model';

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
  financialServiceProvider?: string;
  fspDisplayNamePortal?: string;
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
  fsp?: string | null;
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
  { id: 1, value: RegistrationStatus.startedRegistration },
  { id: 2, value: RegistrationStatus.imported },
  { id: 3, value: RegistrationStatus.invited },
  { id: 4, value: RegistrationStatus.registered },
  { id: 5, value: RegistrationStatus.validated },
  { id: 6, value: RegistrationStatus.included },
  { id: 7, value: RegistrationStatus.inclusionEnded },
  { id: 8, value: RegistrationStatus.declined },
  { id: 9, value: RegistrationStatus.rejected },
  { id: 10, value: RegistrationStatus.paused },
  { id: 11, value: RegistrationStatus.noLongerEligible },
  { id: 12, value: RegistrationStatus.registeredWhileNoLongerEligible },
  { id: 13, value: RegistrationStatus.completed },
];

export enum PersonDefaultAttributes {
  paymentAmountMultiplier = 'paymentAmountMultiplier',
  phoneNumber = 'phoneNumber',
  maxPayments = 'maxPayments',
}

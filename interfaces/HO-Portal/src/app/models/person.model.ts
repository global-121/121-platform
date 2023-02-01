import Permission from '../auth/permission.enum';
import RegistrationStatus from '../enums/registration-status.enum';
import { Attribute } from './attribute.model';
import { PaymentColumnDetail } from './payment.model';
import { ProgramPhase } from './program.model';

// Model for data from the API
export class Person {
  id: number;
  referenceId: string;
  programId: number;
  phoneNumber?: string;
  inclusionScore?: number;
  name?: string;
  startedRegistrationDate?: string;
  importedDate?: string;
  invitedDate?: string;
  noLongerEligibleDate?: string;
  registeredWhileNoLongerEligibleDate?: string;
  registeredDate?: string;
  selectedForValidationDate?: string;
  validationDate?: string;
  inclusionDate?: string;
  inclusionEndDate?: string;
  rejectionDate?: string;
  status: RegistrationStatus;
  hasNote?: boolean;
  hasPhoneNumber?: boolean;
  fsp?: string;
  paymentAmountMultiplier?: number;
  maxPayments?: number;
  preferredLanguage?: LanguageEnum;
  paTableAttributes?: Attribute[];
  registrationProgramId: number;
  payment?: number;
  nrPayments?: number;
  paymentDate?: string;
  transactionAmount?: number;
  transactionStatus?: string;
  errorMessage?: string;
  lastMessageStatus?: string;
  lastMessageType?: string;
}

// Model for display (in table)
export class PersonRow {
  referenceId: string;
  checkboxVisible: boolean;
  pa: string; // Display label
  status: RegistrationStatus; // Not displayed in table, but needed e.g. for updateCheckboxes
  statusLabel: string;
  hasNote: boolean;
  hasPhoneNumber?: boolean;
  digitalIdCreated?: string;
  vulnerabilityAssessmentCompleted?: string | null;
  selectedForValidation?: string | null;
  vulnerabilityAssessmentValidated?: string | null;
  inclusionScore?: number;
  included?: string | null;
  rejected?: string | null;
  inclusionEnded?: string | null;
  imported?: string | null;
  invited?: string | null;
  markedNoLongerEligible?: string | null;
  name?: string | null;
  phoneNumber?: string | null;
  fsp?: string | null;
  paymentAmountMultiplier?: string | null;
  maxPayments?: string | null;
  paymentsLeft?: number | null;
  preferredLanguage?: string | null;
  paTableAttributes?: Person['paTableAttributes'];
  paymentHistory?: PaymentColumnDetail;
  lastMessageStatus?: string;
  messages?: string;
}

export class Note {
  public note: string;
  public noteUpdated: string;
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
}

export const PA_STATUS_ORDER = [
  { id: 1, value: RegistrationStatus.startedRegistration },
  { id: 2, value: RegistrationStatus.imported },
  { id: 3, value: RegistrationStatus.invited },
  { id: 4, value: RegistrationStatus.registered },
  { id: 5, value: RegistrationStatus.selectedForValidation },
  { id: 6, value: RegistrationStatus.validated },
  { id: 7, value: RegistrationStatus.included },
  { id: 8, value: RegistrationStatus.inclusionEnded },
  { id: 9, value: RegistrationStatus.rejected },
  { id: 10, value: RegistrationStatus.noLongerEligible },
  { id: 11, value: RegistrationStatus.registeredWhileNoLongerEligible },
  { id: 12, value: RegistrationStatus.completed },
];

export enum PersonDefaultAttributes {
  paymentAmountMultiplier = 'paymentAmountMultiplier',
  phoneNumber = 'phoneNumber',
  maxPayments = 'maxPayments',
}

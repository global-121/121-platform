import Permission from '../auth/permission.enum';
import RegistrationStatus from '../enums/registration-status.enum';
import { Attribute } from './attribute.model';
import { PaymentColumnDetail } from './payment.model';
import { ProgramPhase } from './program.model';

// Model for data from the API
export class Person {
  id: number;
  referenceId: string;
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
  preferredLanguage?: LanguageEnum;
  paTableAttributes?: Attribute[];
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
  preferredLanguage?: string | null;
  paTableAttributes?: Person['paTableAttributes'];
  paymentHistory?: PaymentColumnDetail;
}

export class Note {
  public note: string;
  public noteUpdated: string;
}

export enum LanguageEnum {
  amET = 'am_ET',
  ar = 'ar',
  en = 'en',
  es = 'es',
  fr = 'fr',
  in = 'in',
  nl = 'nl',
  ptBR = 'pt_BR',
  ru = 'ru',
  ti = 'ti',
  tl = 'tl',
  uk = 'uk',
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
  { id: 1, name: RegistrationStatus.startedRegistration },
  { id: 2, name: RegistrationStatus.imported },
  { id: 3, name: RegistrationStatus.invited },
  { id: 4, name: RegistrationStatus.registered },
  { id: 5, name: RegistrationStatus.selectedForValidation },
  { id: 6, name: RegistrationStatus.validated },
  { id: 7, name: RegistrationStatus.included },
  { id: 8, name: RegistrationStatus.inclusionEnded },
  { id: 9, name: RegistrationStatus.rejected },
  { id: 10, name: RegistrationStatus.noLongerEligible },
  { id: 11, name: RegistrationStatus.registeredWhileNoLongerEligible },
];

export enum PersonDefaultAttributes {
  paymentAmountMultiplier = 'paymentAmountMultiplier',
  phoneNumber = 'phoneNumber',
}

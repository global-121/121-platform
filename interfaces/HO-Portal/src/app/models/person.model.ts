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
  registeredDate?: string;
  selectedForValidationDate?: string;
  validationDate?: string;
  inclusionDate?: string;
  inclusionEndDate?: string;
  rejectionDate?: string;
  status: PaStatus;
  hasNote?: boolean;
  fsp?: string;
  vnumber?: string;
  whatsappPhoneNumber?: string;
  segment?: string;
  paymentAmountMultiplier?: number;
  preferredLanguage?: LanguageEnum;
}

// Model for display (in table)
export class PersonRow {
  referenceId: string;
  checkboxVisible: boolean;
  pa: string; // Display label
  status: PaStatus; // Not displayed in table, but needed e.g. for updateCheckboxes
  statusLabel: string;
  hasNote: boolean;
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
  vnumber?: string | null;
  whatsappPhoneNumber?: string | null;
  segment?: string | null;
  paymentAmountMultiplier?: string | null;
  preferredLanguage?: string | null;
}

export enum PaStatus {
  imported = 'imported',
  invited = 'invited',
  noLongerEligible = 'noLongerEligible',
  startedRegistration = 'startedRegistration',
  registered = 'registered',
  selectedForValidation = 'selectedForValidation',
  registeredWhileNoLongerEligible = 'registeredWhileNoLongerEligible',
  validated = 'validated',
  included = 'included',
  inclusionEnded = 'inclusionEnded',
  rejected = 'rejected',
}

export class Note {
  public note: string;
  public noteUpdated: string;
}

export enum LanguageEnum {
  en = 'en',
  amET = 'am_ET',
  ar = 'ar',
  ti = 'ti',
  tl = 'tl',
  ptBR = 'pt_BR',
  tuvKE = 'tuv_KE',
  saqKE = 'saq_KE',
  in = 'in',
  nl = 'nl',
  es = 'es',
}

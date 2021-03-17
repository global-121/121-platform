// Model for data from the API
export class Person {
  id: number;
  did: string;
  phoneNumber?: string;
  tempScore?: number;
  score?: number;
  name?: string;
  created?: string;
  importedDate?: string;
  invitedDate?: string;
  appliedDate?: string;
  selectedForValidationDate?: string;
  validationDate?: string;
  inclusionDate?: string;
  rejectionDate?: string;
  inclusionNotificationDate?: string;
  status: PaStatus;
  fsp?: string;
  vnumber?: string;
  whatsappPhoneNumber?: string;
  namePartnerOrganization?: string;
}

// Model for display (in table)
export class PersonRow {
  did: string;
  checkboxVisible: boolean;
  pa: string; // Display label
  status: PaStatus; // Not displayed in table, but needed e.g. for updateCheckboxes
  statusLabel: string;
  digitalIdCreated?: string;
  vulnerabilityAssessmentCompleted?: string | null;
  tempScore?: number;
  selectedForValidation?: string | null;
  vulnerabilityAssessmentValidated?: string | null;
  finalScore?: number;
  included?: string | null;
  rejected?: string | null;
  notifiedOfInclusion?: string | null;
  imported?: string | null;
  invited?: string | null;
  name?: string | null;
  phoneNumber?: string | null;
  fsp?: string | null;
  vnumber?: string | null;
  whatsappPhoneNumber?: string | null;
  namePartnerOrganization?: string | null;
}

export enum PaStatus {
  imported = 'imported',
  invited = 'invited',
  created = 'created',
  registered = 'registered',
  selectedForValidation = 'selectedForValidation',
  validated = 'validated',
  included = 'included',
  rejected = 'rejected',
}

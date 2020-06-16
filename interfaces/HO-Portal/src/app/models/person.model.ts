// Model for data from the API
export class Person {
  did: string;
  phoneNumber?: string;
  tempScore?: number;
  score?: number;
  name?: string;
  dob?: string;
  included?: boolean;
  excluded?: boolean;
  created?: string;
  updated?: string;
  appliedDate?: string;
  selectedForValidationDate?: string;
  validationDate?: string;
  inclusionDate?: string;
}

// Model for display (in table)
export class PersonRow {
  did: string;
  checkboxVisible: boolean;
  pa: string; // Display label
  digitalIdCreated?: string;
  vulnerabilityAssessmentCompleted?: string | null;
  tempScore?: number;
  selectedForValidation?: string | null;
  vulnerabilityAssessmentValidated?: string | null;
  finalScore?: number;
}

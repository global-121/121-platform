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
  digitalIdCreated?: string;
  vulnerabilityAssessmentCompleted?: string;
  selectedForValidation?: string;
  vulnerabilityAssessmentValidated?: string;
  finalScore?: number;
  inclusionDate?: string;
  checkboxVisible: boolean;
}

export class PersonRow extends Person {
  pa?: string; // Display label
}

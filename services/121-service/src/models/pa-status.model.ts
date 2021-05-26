export enum PaStatus {
  imported = 'imported',
  invited = 'invited',
  noLongerEligible = 'noLongerEligible',
  created = 'created',
  registered = 'registered',
  registeredWhileNoLongerEligible = 'registeredWhileNoLongerEligible',
  selectedForValidation = 'selectedForValidation',
  validated = 'validated',
  included = 'included',
  inclusionEnded = 'inclusionEnded',
  rejected = 'rejected',
}

export enum PaStatusTimestampField {
  selectedForValidationDate = 'selectedForValidationDate',
  noLongerEligibleDate = 'noLongerEligibleDate',
}

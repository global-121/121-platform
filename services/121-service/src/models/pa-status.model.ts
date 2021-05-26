export enum PaStatus {
  imported = 'imported',
  invited = 'invited',
  created = 'created',
  registered = 'registered',
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

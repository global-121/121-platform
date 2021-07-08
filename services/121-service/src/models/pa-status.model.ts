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
  created = 'created',
  importedDate = 'importedDate',
  invitedDate = 'invitedDate',
  noLongerEligibleDate = 'noLongerEligibleDate',
  accountCreatedDate = 'accountCreatedDate',
  appliedDate = 'appliedDate',
  selectedForValidationDate = 'selectedForValidationDate',
  validationDate = 'validationDate',
  inclusionDate = 'inclusionDate',
  inclusionEndDate = 'inclusionEndDate',
  rejectionDate = 'rejectionDate',
}

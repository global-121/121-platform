export enum RegistrationStatusEnum {
  imported = 'imported',
  invited = 'invited',
  startedRegistation = 'startedRegistration',
  registered = 'registered',
  selectedForValidation = 'selectedForValidation',
  validated = 'validated',
  included = 'included',
  rejected = 'rejected',
  noLongerEligible = 'noLongerEligible',
  registeredWhileNoLongerEligible = 'registeredWhileNoLongerEligible',
  inclusionEnded = 'inclusionEnded',
}

export enum RegistrationStatusTimestampField {
  startedRegistationDate = 'startedRegistationDate',
  importedDate = 'importedDate',
  invitedDate = 'invitedDate',
  noLongerEligibleDate = 'noLongerEligibleDate',
  accountCreatedDate = 'accountCreatedDate',
  registeredDate = 'registeredDate',
  selectedForValidationDate = 'selectedForValidationDate',
  validationDate = 'validationDate',
  inclusionDate = 'inclusionDate',
  inclusionEndDate = 'inclusionEndDate',
  rejectionDate = 'rejectionDate',
}

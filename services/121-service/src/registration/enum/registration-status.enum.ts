export enum RegistrationStatusEnum {
  imported = 'imported',
  invited = 'invited',
  startedRegistration = 'startedRegistration',
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
  startedRegistrationDate = 'startedRegistrationDate',
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
  registeredWhileNoLongerEligibleDate = 'registeredWhileNoLongerEligibleDate',
}

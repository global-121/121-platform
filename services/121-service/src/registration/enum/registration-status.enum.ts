export enum RegistrationStatusEnum {
  startedRegistration = 'startedRegistration',
  registered = 'registered',
  validated = 'validated',
  included = 'included',
  rejected = 'rejected',
  inclusionEnded = 'inclusionEnded',
  deleted = 'deleted',
  completed = 'completed',
  paused = 'paused',
  declined = 'declined',
}

export enum RegistrationStatusTimestampField {
  startedRegistrationDate = 'startedRegistrationDate',
  registeredDate = 'registeredDate',
  rejectionDate = 'rejectionDate',
  validationDate = 'validationDate',
  inclusionDate = 'inclusionDate',
  inclusionEndDate = 'inclusionEndDate',
  deleteDate = 'deleteDate',
  completedDate = 'completedDate',
  pausedDate = 'pausedDate',
  declinedDate = 'declinedDate',
}

export enum RegistrationStatusDateMap {
  startedRegistration = RegistrationStatusTimestampField.startedRegistrationDate,
  registered = RegistrationStatusTimestampField.registeredDate,
  validated = RegistrationStatusTimestampField.validationDate,
  included = RegistrationStatusTimestampField.inclusionDate,
  rejected = RegistrationStatusTimestampField.rejectionDate,
  inclusionEnded = RegistrationStatusTimestampField.inclusionEndDate,
  deleted = RegistrationStatusTimestampField.deleteDate,
  completed = RegistrationStatusTimestampField.completedDate,
  paused = RegistrationStatusTimestampField.pausedDate,
  declined = RegistrationStatusTimestampField.declinedDate,
}

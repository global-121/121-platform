export enum RegistrationStatusEnum {
  registered = 'registered',
  validated = 'validated',
  included = 'included',
  rejected = 'rejected',
  deleted = 'deleted',
  completed = 'completed',
  paused = 'paused',
  declined = 'declined',
}

export enum RegistrationStatusTimestampField {
  registeredDate = 'registeredDate',
  rejectionDate = 'rejectionDate',
  validationDate = 'validationDate',
  inclusionDate = 'inclusionDate',
  deleteDate = 'deleteDate',
  completedDate = 'completedDate',
  pausedDate = 'pausedDate',
  declinedDate = 'declinedDate',
}

export enum RegistrationStatusDateMap {
  registered = RegistrationStatusTimestampField.registeredDate,
  validated = RegistrationStatusTimestampField.validationDate,
  included = RegistrationStatusTimestampField.inclusionDate,
  rejected = RegistrationStatusTimestampField.rejectionDate,
  deleted = RegistrationStatusTimestampField.deleteDate,
  completed = RegistrationStatusTimestampField.completedDate,
  paused = RegistrationStatusTimestampField.pausedDate,
  declined = RegistrationStatusTimestampField.declinedDate,
}

export enum RegistrationStatusEnum {
  new = 'new',
  validated = 'validated',
  included = 'included',
  deleted = 'deleted',
  completed = 'completed',
  paused = 'paused',
  declined = 'declined',
}

export enum RegistrationStatusTimestampField {
  registeredDate = 'registeredDate',
  validationDate = 'validationDate',
  inclusionDate = 'inclusionDate',
  deleteDate = 'deleteDate',
  completedDate = 'completedDate',
  pausedDate = 'pausedDate',
  declinedDate = 'declinedDate',
}

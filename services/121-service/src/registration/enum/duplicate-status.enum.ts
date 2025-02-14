// The reason we have this enum instead of a boolean is because we expect to have more statuses in the future
export enum DuplicateStatus {
  duplicate = 'duplicate',
  unique = 'unique',
}

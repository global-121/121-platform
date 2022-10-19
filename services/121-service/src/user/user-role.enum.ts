export enum DefaultUserRole {
  ProgramAdmin = 'program-admin',
  FieldValidation = 'field-validation',
  PersonalData = 'personal-data',
  RunProgram = 'run-program',
  View = 'view',
}

export enum PersonAffectedRole {
  PersonAffected = 'person-affected',
}

export type AuthenticationRole = DefaultUserRole | PersonAffectedRole;

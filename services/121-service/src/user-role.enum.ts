export enum UserRole {
  Admin = 'admin',
  FieldValidation = 'field-validation',
  PersonalData = 'personal-data',
  RunProgram = 'run-program',
  View = 'view',
}

export enum PersonAffectedRole {
  PersonAffected = 'person-affected',
}

export type AuthenticationRole = UserRole | PersonAffectedRole;

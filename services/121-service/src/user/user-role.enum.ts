export enum DefaultUserRole {
  ProgramAdmin = 'program-admin',
  FieldValidation = 'field-validation',
  PersonalData = 'personal-data',
  RunProgram = 'run-program',
  View = 'view',
  KoboUser = 'kobo-user',
  CvaManager = 'cva-manager',
  CvaOfficer = 'cva-officer',
  FinanceManager = 'finance-manager',
  FinanceOfficer = 'finance-officer',
}

export enum PersonAffectedRole {
  PersonAffected = 'person-affected',
}

export type AuthenticationRole = DefaultUserRole | PersonAffectedRole;

export enum DefaultUserRole {
  ProgramAdmin = 'program-admin',
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

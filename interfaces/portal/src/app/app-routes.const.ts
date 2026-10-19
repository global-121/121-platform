export enum AppRoutes {
  authCallback = 'auth-callback',
  changePassword = 'change-password',
  login = 'login',
  privacy = 'privacy',
  program = 'program',
  programMonitoring = 'monitoring',
  programPaymentLog = 'payment-log',
  programPayments = 'payments',
  programPaymentTransactionList = 'transaction-list',
  programRegistrationActivityLog = 'activity-log',
  programRegistrationDebitCards = 'debit-cards',
  programRegistrationPersonalInformation = 'personal-information',
  programRegistrations = 'registrations',
  programs = 'programs',
  programSettings = 'settings',
  programSettingsFsps = 'fsps',
  programSettingsInformation = 'information',
  programSettingsPaymentApproval = 'payment-approval',
  programSettingsRegistrationData = 'registration-data',
  programSettingsTeam = 'team',
  registrationByReferenceId = 'registration-by-reference-id',
  registrationLookup = 'registration-lookup',
  snake = 'snake',
  userRoles = 'user-roles',
  users = 'users',
}

// @TODO
// ISSUE https://dev.azure.com/redcrossnl/121%20Platform/_workitems/edit/42350
// The AppRoutes enum makes little sense when we have nested routes, as we can't use it to define the nested paths (e.g. `${AppRoutes.programMonitoring}/dashboard` doesn't work).

// Temporary 'fix' to avoid collisions in this 'AppRoutes' enum.
export enum ProgramMonitoringPaths {
  dashboard = 'dashboard',
  dataChanges = 'data-changes',
  debitCards = 'debit-cards',
  files = 'files',
  powerBI = 'powerbi',
}

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

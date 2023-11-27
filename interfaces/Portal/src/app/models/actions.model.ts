export enum ActionType {
  importPeopleAffected = 'import-people-affected',
  importRegistrations = 'import-registrations',
  paymentFinished = 'payment-finished',
  paymentStarted = 'payment-started',
  exportFspInstructions = 'export-fsp-instructions',
  importFspReconciliation = 'import-fsp-reconciliation',
  exportTableView = 'export-table-view',
}

export class LatestAction {
  id: number;
  actionType: ActionType;
  created: Date | string;
}

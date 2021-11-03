export enum ActionType {
  importPeopleAffected = 'import-people-affected',
  importRegistrations = 'import-registrations',
  paymentFinished = 'payment-finished',
  paymentStarted = 'payment-started',
  testMpesaPayment = 'test-mpesa-payment',
  exportFspInstructions = 'export-fsp-instructions',
}

export class LatestAction {
  id: number;
  actionType: ActionType;
  created: Date | string;
}

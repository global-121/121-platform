export enum ActionType {
  importPeopleAffected = 'import-people-affected',
  importRegistrations = 'import-registrations',
  paymentFinished = 'payment-finished',
  paymentStarted = 'payment-started',
  testMpesaPayment = 'test-mpesa-payment',
}

export class LatestAction {
  id: number;
  actionType: ActionType;
  timestamp: Date | string;
}

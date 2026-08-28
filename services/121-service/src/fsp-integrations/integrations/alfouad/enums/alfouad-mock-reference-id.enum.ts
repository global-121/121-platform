// Mock referenceIds used to drive the (stateless) Al Fouad mock from end-to-end
// tests. `AlfouadService.generateReferenceNumber` passes them through unchanged
// in mock mode so the mock's TransactionByRef endpoint — which receives only the
// reference number — can derive the desired transaction state from it.
export enum AlfouadMockReferenceId {
  stateNotFound = '00000000-0000-0000-0000-000000000404',
  statePendingApproval = '00000000-0000-0000-0000-000000000001',
  stateApproved = '00000000-0000-0000-0000-000000000002',
  stateHold = '00000000-0000-0000-0000-000000000004',
  stateCanceled = '00000000-0000-0000-0000-000000000005',
}

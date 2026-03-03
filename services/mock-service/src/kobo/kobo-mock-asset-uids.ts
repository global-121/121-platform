/**
 * Asset UIDs used by the mock Kobo service.
 * A similar enum is stored in the 121-service test fixtures, but code between
 * the two packages cannot be shared in a practical way, so we duplicate the
 * constants here. Keep both files in sync.
 */
export enum KoboMockAssetUids {
  happyFlow = 'asset-id-happy-flow',
  bodyThatTriggersErrors = 'asset-id-body-that-triggers-errors',
  notFound = 'asset-id-not-found',
  happyFlowWithChanges = 'asset-id-happy-flow-with-changes',
  withExistingWebhook = 'asset-id-with-existing-webhook',
}

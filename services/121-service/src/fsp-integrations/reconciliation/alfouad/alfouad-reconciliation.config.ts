// Upper bound on how many 'waiting' Al Fouad transactions are reconciled per nightly run.
// The reconciliation calls the Al Fouad API sequentially per transaction, so this cap
// prevents a single run from taking too long if a large backlog builds up.
export const ALFOUAD_RECONCILIATION_MAX_TRANSACTIONS_PER_RUN = 1000;

export const ALFOUAD_RECONCILIATION_CANCELED_MESSAGE =
  'The transaction was canceled at Al Fouad.';

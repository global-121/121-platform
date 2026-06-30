// Shared configuration for the MTN reconciliation queue and cronjob.
// The queue limiter and the cronjob interval together determine how many
// transactions can safely be enqueued per run without building up a backlog.
export const MTN_RECONCILIATION_QUEUE_MAX_JOBS_PER_SECOND = 20;
export const MTN_RECONCILIATION_QUEUE_LIMITER_DURATION_MS = 1000;
const MTN_RECONCILIATION_INTERVAL_SECONDS = 5 * 60;

export const MTN_RECONCILIATION_MAX_TRANSACTIONS_PER_RUN =
  MTN_RECONCILIATION_QUEUE_MAX_JOBS_PER_SECOND *
  MTN_RECONCILIATION_INTERVAL_SECONDS;

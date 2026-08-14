import { generateUUIDFromSeed } from '@121-service/src/utils/uuid.helpers';

/**
 * Generates a deterministic transaction reference for an FSP call.
 *
 * The reference is a pure function of the registration referenceId, the
 * transactionId and the number of failed transaction attempts. This ensures:
 * - Payment retry: a new failed-attempt count yields a NEW reference, so the FSP
 *   does not block it as a duplicate.
 * - Queue retry: the same count yields the SAME reference, so the FSP blocks it
 *   as a duplicate (preventing a double transaction).
 *
 * Determinism relies on env.UUID_NAMESPACE being set for the environment
 * (it defaults to a random value per process when unset). Reconciliation that
 * recomputes the reference only matches while that namespace stays constant.
 */
export function computeTransactionReference({
  referenceId,
  transactionId,
  failedTransactionAttempts,
}: {
  referenceId: string;
  transactionId: number;
  failedTransactionAttempts: number;
}): string {
  return generateUUIDFromSeed(
    `ReferenceId=${referenceId},TransactionId=${transactionId},Attempt=${failedTransactionAttempts}`,
  );
}

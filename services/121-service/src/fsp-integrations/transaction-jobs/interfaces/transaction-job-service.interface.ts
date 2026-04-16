export interface TransactionJobService {
  processTransactionJob: (data: unknown) => Promise<void>;
}

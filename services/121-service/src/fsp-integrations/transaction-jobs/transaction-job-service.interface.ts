export interface TransactionJobService {
  processTransactionJob: (data: any) => Promise<void>;
}

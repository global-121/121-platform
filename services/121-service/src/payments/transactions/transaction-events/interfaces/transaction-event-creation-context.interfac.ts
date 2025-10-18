export interface TransactionEventCreationContext {
  transactionId: number;
  userId: number | null;
  programFspConfigurationId: number;
}

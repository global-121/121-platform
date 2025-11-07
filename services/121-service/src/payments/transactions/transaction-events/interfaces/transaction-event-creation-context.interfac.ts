export interface TransactionEventCreationContext {
  transactionId: number;
  userId: number | null;
  programFspConfigurationId: number;
  programId?: number; // ##TODO work with separate interface instaed of making these optional
  referenceId?: string;
}

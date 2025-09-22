export interface SharedTransactionJobDto {
  readonly programFspConfigurationId: number;
  readonly transactionAmount: number; // This is in the major unit of the currency, for example whole euros
  readonly programId: number;
  readonly paymentId: number;
  readonly userId: number;
  readonly referenceId: string;
  readonly isRetry: boolean;
  readonly bulkSize: number;
}

export interface AirtelTransactionJobDto {
  readonly programId: number;
  readonly programFspConfigurationId: number;
  readonly paymentId: number;
  readonly referenceId: string;
  readonly transactionAmount: number;
  readonly isRetry: boolean;
  readonly userId: number;
  readonly bulkSize: number;
  readonly phoneNumber: string;
}

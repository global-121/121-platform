export interface SharedTransactionJobDto {
  readonly programFspConfigurationId: number;
  readonly programId: number;
  readonly paymentId: number;
  readonly userId: number;
  readonly referenceId: string;
  readonly isRetry: boolean;
  readonly bulkSize: number;
}

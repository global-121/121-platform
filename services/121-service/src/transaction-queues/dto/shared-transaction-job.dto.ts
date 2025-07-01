export interface SharedTransactionJobDto {
  readonly programFspConfigurationId: number;
  readonly programId: number;
  readonly paymentNumber: number;
  readonly userId: number;
  readonly referenceId: string;
  readonly phoneNumber: string;
  readonly isRetry: boolean;
  readonly bulkSize: number;
}

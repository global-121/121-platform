export interface SharedTransactionJobDto {
  readonly projectFspConfigurationId: number;
  readonly projectId: number;
  readonly paymentId: number;
  readonly userId: number;
  readonly referenceId: string;
  readonly phoneNumber: string;
  readonly isRetry: boolean;
  readonly bulkSize: number;
}

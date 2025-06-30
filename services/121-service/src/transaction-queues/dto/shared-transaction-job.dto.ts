export interface SharedTransactionJobDto {
  readonly programFspConfigurationId: number;
  readonly programId: number;
  readonly paymentNumber: number;
  readonly userId: number;
  readonly isRetry: boolean;
}

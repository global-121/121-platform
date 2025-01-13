// TODO: Why is this called Dto and not interface? (also for safaricom and visa?)
export interface NedbankTransactionJobDto {
  readonly programId: number;
  readonly programFinancialServiceProviderConfigurationId: number;
  readonly paymentNumber: number;
  readonly referenceId: string;
  readonly transactionAmount: number;
  readonly isRetry: boolean;
  readonly userId: number;
  readonly bulkSize: number;
  readonly phoneNumber: string;
}

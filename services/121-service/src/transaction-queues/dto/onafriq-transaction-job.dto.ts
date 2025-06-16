export interface OnafriqTransactionJobDto {
  readonly programId: number;
  readonly programFspConfigurationId: number;
  readonly paymentNumber: number;
  readonly referenceId: string;
  readonly transactionAmount: number;
  readonly isRetry: boolean;
  readonly userId: number;
  readonly bulkSize: number;
  readonly thirdPartyTransId: string;
  readonly phoneNumber: string;
  readonly firstName: string;
  readonly lastName: string;
}

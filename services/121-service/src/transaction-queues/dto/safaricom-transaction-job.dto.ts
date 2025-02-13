export interface SafaricomTransactionJobDto {
  readonly programId: number;
  readonly projectFinancialServiceProviderConfigurationId: number;
  readonly paymentNumber: number;
  readonly referenceId: string;
  readonly transactionAmount: number;
  readonly isRetry: boolean;
  readonly userId: number;
  readonly bulkSize: number;
  readonly originatorConversationId: string;
  readonly phoneNumber: string;
  readonly idNumber: string;
}

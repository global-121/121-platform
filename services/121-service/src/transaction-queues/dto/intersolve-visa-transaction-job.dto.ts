export interface IntersolveVisaTransactionJobDto {
  readonly programId: number;
  readonly paymentNumber: number;
  readonly referenceId: string;
  readonly transactionAmountInMajorUnit: number; // This is in the major unit of the currency, for example whole euros
  readonly programFinancialServiceProviderConfigurationId: number;
  readonly isRetry: boolean;
  readonly userId: number;
  readonly bulkSize: number;
  readonly name?: string;
  readonly addressStreet?: string;
  readonly addressHouseNumber?: string;
  readonly addressHouseNumberAddition?: string;
  readonly addressPostalCode?: string;
  readonly addressCity?: string;
  readonly phoneNumber?: string;
}

export interface TransactionCreationDetails {
  registrationId: number;
  transferValue: number;
  readonly paymentAmountMultiplier: number;
  programFspConfigurationId: number;
}

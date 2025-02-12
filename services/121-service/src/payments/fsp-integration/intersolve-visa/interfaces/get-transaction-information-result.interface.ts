export interface GetTransactionInformationResult {
  readonly spentThisMonth: number;
  readonly lastTransactionDate: Date | null;
}

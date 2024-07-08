export interface TokenBalance {
  readonly quantity: {
    readonly assetCode: string;
    readonly value: number;
    readonly reserved: number;
  };
  readonly discountBudgetValue: number;
  readonly lastChangedAt: string;
}

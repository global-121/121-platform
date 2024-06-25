export class TokenResponseBalance {
  public quantity: {
    assetCode: string;
    value: number;
    reserved: number;
  };
  public discountBudgetValue: number;
  public lastChangedAt: string;
}

export interface CreateTransactionParams {
  readonly transferAmount: number;
  readonly phoneNumberPayment: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly thirdPartyTransId: string;
}

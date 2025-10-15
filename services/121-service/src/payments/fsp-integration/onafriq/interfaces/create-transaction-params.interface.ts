export interface CreateTransactionParams {
  readonly transferAmount: number;
  readonly phoneNumberPayment: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly thirdPartyTransId: string;
  readonly credentials: Credentials;
}

export interface Credentials {
  readonly corporateCode: string;
  readonly password: string;
  readonly uniqueKey: string;
}

// Wire format for the `GET api/Transaction/TransactionByRef` response body.
// `State` is the numeric lifecycle state (see AlfouadApiTransactionStateEnum);
// on a "not found" / failure it is "0" and `ErrorCode` is populated.
export interface AlfouadApiGetTransactionResponseBodyDto {
  readonly State: string;
  readonly Message: string;
  readonly ErrorCode?: string | null;
  readonly TransactionInfo?: {
    readonly TransactionUID?: string;
  } | null;
}

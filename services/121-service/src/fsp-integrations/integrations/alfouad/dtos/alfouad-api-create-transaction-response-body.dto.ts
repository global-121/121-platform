export interface AlfouadApiCreateTransactionResponseBodyDto {
  readonly State: string;
  readonly Message: string;
  readonly ErrorCode?: string | null;
  readonly TransactionInfo?: {
    readonly TransactionUID?: string;
  } | null;
}

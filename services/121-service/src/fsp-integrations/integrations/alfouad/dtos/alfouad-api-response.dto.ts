export interface AlfouadApiResponseDto {
  readonly State: string;
  readonly Message: string;
  readonly ErrorCode?: string | null;
  readonly TransactionInfo?: {
    readonly TransactionUID?: string;
  } | null;
}

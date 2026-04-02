export interface MtnTransferCallbackJobDto {
  readonly transactionId: number;
  readonly referenceId: string;
  readonly status: string;
  readonly reason?: string;
}

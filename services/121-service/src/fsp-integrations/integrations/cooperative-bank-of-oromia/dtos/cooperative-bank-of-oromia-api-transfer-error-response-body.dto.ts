export interface CooperativeBankOfOromiaApiTransferErrorResponseBodyDto {
  readonly code: string;
  readonly message?: string; // sometimes it is 'message'...
  readonly messages?: string; // ...sometimes 'messages'
  readonly description: string;
}

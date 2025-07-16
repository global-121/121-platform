export interface OnafriqTransactionCallbackJobDto {
  readonly thirdPartyTransId: string;
  readonly mfsTransId: string;
  readonly statusCode: string;
  readonly statusMessage: string;
}

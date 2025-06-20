export interface OnafriqApiWebhookSubscribeResponseBody {
  readonly status: number;
  readonly statusText: string;
  readonly data: {
    readonly message: number;
    readonly data: {
      readonly corporateCode: string;
      readonly callbackUrl: string;
    };
  };
}

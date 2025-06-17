export interface WebhookSubscribeResponseOnafriqApiDto {
  readonly status: number; // e.g. 200
  readonly statusText: string; // e.g. "OK"
  readonly data: {
    readonly message: number;
    readonly data: {
      readonly corporateCode: string;
      readonly callbackUrl: string;
    };
  };
}

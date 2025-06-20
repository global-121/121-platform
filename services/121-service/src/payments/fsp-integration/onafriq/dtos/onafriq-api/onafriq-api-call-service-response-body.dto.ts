export interface OnafriqApiCallServiceResponseBody {
  readonly data: {
    readonly totalTxSent: number;
    readonly noTxAccepted: number;
    readonly noTxRejected: number;
    readonly details: {
      readonly transResponse: {
        readonly thirdPartyId: string;
        readonly status: {
          readonly code: string;
          readonly message: string;
          readonly messageDetail?: string;
        };
      }[];
    };
    readonly timestamp: string;
  };
}

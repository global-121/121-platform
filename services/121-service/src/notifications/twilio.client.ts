/* eslint-disable @typescript-eslint/no-var-requires */
let mockClient = null as any;
const twilio = require('twilio');
if (!!process.env.MOCK_TWILIO) {
  class PrismClient {
    public prismUrl: string;
    public requestClient: any;
    constructor(prismUrl, requestClient) {
      this.prismUrl = prismUrl;
      this.requestClient = requestClient;
    }
    public request(opts): any {
      opts.uri = opts.uri.replace(
        /^https\:\/\/.*?\.twilio\.com/,
        this.prismUrl,
      );
      return this.requestClient.request(opts);
    }
  }

  const { RequestClient } = twilio;
  mockClient = {
    httpClient: new PrismClient(
      `${process.env.MOCK_TWILIO_URL}api`,
      new RequestClient(),
    ),
  };
}

export const twilioClient = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTHTOKEN,
  mockClient,
);

import { RequestClient } from 'twilio';
import { HttpMethod } from 'twilio/lib/interfaces';

// eslint-disable-next-line @typescript-eslint/no-require-imports
export const twilio = require('twilio');

class PrismClient {
  public prismUrl: string;
  public requestClient: RequestClient;

  constructor(prismUrl: string, requestClient: RequestClient) {
    this.prismUrl = prismUrl;
    this.requestClient = requestClient;
  }

  public request(opts: {
    uri: string;
    method: HttpMethod;
    [key: string]: unknown;
  }): Promise<unknown> {
    opts.uri = opts.uri.replace(/^https:\/\/.*?\.twilio\.com/, this.prismUrl);
    return this.requestClient.request(opts);
  }
}

let mockClient: { httpClient: PrismClient } | null = null;

if (!!process.env.MOCK_TWILIO) {
  const { RequestClient } = twilio;

  mockClient = {
    httpClient: new PrismClient(
      `${process.env.MOCK_SERVICE_URL}api`,
      new RequestClient(),
    ),
  };
}

export const twilioClient = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTHTOKEN,
  mockClient,
);

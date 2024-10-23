import twilio, { ClientOpts } from 'twilio';
import { RequestClient } from 'twilio';
import { HttpMethod } from 'twilio/lib/interfaces';

class MockTwilioRequestClient extends RequestClient {
  public mockUrl: string;

  constructor(mockUrl: string) {
    super();
    this.mockUrl = mockUrl;
  }

  public override request<TData>(opts: {
    uri: string;
    method: HttpMethod;
    [key: string]: unknown;
  }) {
    opts.uri = opts.uri.replace(/^https:\/\/.*?\.twilio\.com/, this.mockUrl);
    return super.request<TData>(opts);
  }
}

let mockClient: ClientOpts | undefined;

if (!!process.env.MOCK_TWILIO) {
  mockClient = {
    httpClient: new MockTwilioRequestClient(
      `${process.env.MOCK_SERVICE_URL}api`,
    ),
  };
}

export const twilioClient = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTHTOKEN,
  mockClient,
);

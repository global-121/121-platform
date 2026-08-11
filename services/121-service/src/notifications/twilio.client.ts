import twilio, { ClientOpts } from 'twilio';
import { RequestClient } from 'twilio';
import { HttpMethod } from 'twilio/lib/interfaces';

import { env } from '@121-service/src/env';
import { TwilioMode } from '@121-service/src/notifications/enum/twilio-mode.enum';

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

if (env.TWILIO_MODE === TwilioMode.mock) {
  mockClient = {
    httpClient: new MockTwilioRequestClient(`${env.MOCK_SERVICE_URL}/api`),
  };
}

// TWILIO_SID/TWILIO_AUTHTOKEN are optional because they are not required when
// TWILIO_MODE=DISABLED. Fall back to placeholder values so the client can still
// be constructed; sending is skipped in disabled mode (see the message services).
export const twilioClient = twilio(
  env.TWILIO_SID ?? 'ACplaceholder',
  env.TWILIO_AUTHTOKEN ?? 'placeholder',
  mockClient,
);

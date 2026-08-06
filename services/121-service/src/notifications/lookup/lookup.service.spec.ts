import { env } from '@121-service/src/env';
import { TwilioMode } from '@121-service/src/notifications/enum/twilio-mode.enum';
import { LookupService } from '@121-service/src/notifications/lookup/lookup.service';
import { twilioClient } from '@121-service/src/notifications/twilio.client';

jest.mock('@121-service/src/env', () => ({
  env: { TWILIO_MODE: 'DISABLED' },
}));

jest.mock('@121-service/src/notifications/twilio.client', () => ({
  twilioClient: { lookups: { v1: { phoneNumbers: jest.fn() } } },
}));

const mockEnv = env as { TWILIO_MODE: string };

describe('LookupService (Twilio disabled)', () => {
  const service = new LookupService();

  beforeEach(() => {
    mockEnv.TWILIO_MODE = TwilioMode.disabled;
    (twilioClient.lookups.v1.phoneNumbers as unknown as jest.Mock).mockClear();
  });

  it('does not call the Twilio carrier lookup when Twilio is disabled', async () => {
    await service.lookupAndCorrect('+31600000000');

    expect(twilioClient.lookups.v1.phoneNumbers).not.toHaveBeenCalled();
  });
});

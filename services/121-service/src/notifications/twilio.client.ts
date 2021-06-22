import { TwilioClientMock } from './twilio.mock';

export const twilioClient = !!process.env.MOCK_TWILIO
  ? new TwilioClientMock()
  : require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_AUTHTOKEN);

export const twilio = !!process.env.MOCK_TWILIO
  ? new TwilioClientMock()
  : require('twilio');

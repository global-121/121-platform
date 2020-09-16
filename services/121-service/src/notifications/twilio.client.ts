import { TWILIO } from '../secrets';

export const twilioClient = require('twilio')(
  TWILIO.tokenSid,
  TWILIO.tokenSecret,
  {
    accountSid: TWILIO.sid,
  },
);
export const twilio = require('twilio');

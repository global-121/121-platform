import { TWILIO } from '../tokens/twilio';

export const twilioClient = require('twilio')(TWILIO.sid, TWILIO.authToken);
export const twilio = require('twilio');

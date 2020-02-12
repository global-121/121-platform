import { TWILIO } from '../secrets';
import { PRODUCTION_URL, STAGING_URL } from '../config';

export const twilioClient = require('twilio')(TWILIO.sid, TWILIO.authToken);
export const twilio = require('twilio');

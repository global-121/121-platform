import { TWILIO } from "../secrets";

export const twilioClient = require('twilio')(TWILIO.sid, TWILIO.authToken);
export const twilio = require('twilio');

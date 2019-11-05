import { TWILIO } from '../secrets';
import { PRODUCTION_URL, STAGING_URL } from '../config';

export const twilioClient = require('twilio')(TWILIO.sid, TWILIO.authToken);
export const twilio = require('twilio');

let appUrl: string;
if (process.env.NODE_ENV == 'production') {
  appUrl = PRODUCTION_URL;
} else if (process.env.NODE_ENV == 'staging') {
  appUrl = STAGING_URL;
} else {
  appUrl = TWILIO.ngrok;
}
export default appUrl;
export const callbackUrl = appUrl + 'api/sms/status';
export const voiceXmlUrl = appUrl + 'api/voice/xml/';

export const TWILIO_MP3 = {
  negativeInclusion : {
    param: 'negativeInclusion',
    url: 'http://api.twilio.com/cowbell.mp3',
  },
  positiveInlclusion : {
    param: 'negativeInclusion',
    url: 'http://demo.twilio.com/docs/classic.mp3',
  }
}

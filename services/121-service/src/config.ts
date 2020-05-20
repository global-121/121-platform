export const DEBUG = (['production', 'staging'].indexOf(process.env.NODE_ENV) === -1);
export const PORT = (process.env.PORT) ? process.env.PORT : 3000;
export const BASE_PATH = (DEBUG) ? 'api' : '121-service/api';
export const SCHEME = (DEBUG) ? 'http' : 'https';

const tyknIMS = 'http://11.0.0.3:50001/api/';
const orgIMS = 'http://11.0.0.4:50002/api/';
const diberse_url = 'https://b2b.demo.disberse.com/project/​'


export const API = {
  disberse: {
    url: diberse_url,
    key: process.env.DISBERSE_API_KEY,
  },
  schema: tyknIMS + 'schema',
  credential: {
    definition: orgIMS + 'credential/definition',
    credoffer: orgIMS + 'credential/credoffer',
    issue: orgIMS + 'credential/issue',
  },
  proof: {
    verify: orgIMS + 'proof/verify',
  },
  fsp: [
    {
      payout: 'https://example.com/post',
      name: 'Bank A',
    },
    {
      payout: 'https://example.com/post',
      name: 'Mobile Money Provider B',
    },
    {
      payout: 'https://example.com/post',
      name: 'FSP C - mixed attributes',
    },
    {
      payout: 'https://example.com/post',
      name: 'FSP D - no attributes',
    },
  ],
};

export const EXTERNAL_API = {
  callbackUrlSms: process.env.EXTERNAL_121_SERVICE_URL + 'api/notifications/sms/status',
  callbackUrlVoice: process.env.EXTERNAL_121_SERVICE_URL + 'api/notifications/voice/status',
  voiceXmlUrl: process.env.EXTERNAL_121_SERVICE_URL + 'api/notifications/voice/xml/',
  voiceMp3lUrl: process.env.EXTERNAL_121_SERVICE_URL + 'api/notifications/voice/mp3/',
};

export const DEBUG =
  ['production', 'staging', 'test'].indexOf(process.env.NODE_ENV) === -1;
export const PORT = process.env.PORT_121_SERVICE;
export const BASE_PATH = process.env.SUBDOMAIN_121_SERVICE + '/api';
export const SCHEME = DEBUG ? 'http' : 'https';

const tyknIMS = 'http://11.0.0.3:50001/api/';
const orgIMS = 'http://11.0.0.4:50002/api/';
const userIMS = 'http://11.0.0.5:50003/api/';

export const URL_PA_ACCOUNTS_SERVICE_API = process.env.LOCAL_DEVELOPMENT
  ? 'localhost:' + process.env.PORT_PA_ACCOUNTS_SERVICE + '/api'
  : process.env.URL_PA_ACCOUNTS_SERVICE_API;

export const API = {
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
      id: 1,
    },
    {
      payout: 'https://example.com/post',
      name: 'Mobile Money Provider B',
      id: 2,
    },
    {
      payout: 'https://example.com/post',
      name: 'FSP C - mixed attributes',
      id: 3,
    },
    {
      payout: 'https://example.com/post',
      name: 'FSP D - no attributes',
      id: 4,
    },
  ],
  paAccounts: {
    getCredentialHandleProof:
      URL_PA_ACCOUNTS_SERVICE_API + '/get-credential-handle-proof',
    deleteAccount: URL_PA_ACCOUNTS_SERVICE_API + '/user/get-wallet-and-delete',
  },
  userIMS: {
    deleteWallet: userIMS + 'wallet/delete',
  },
};

export const EXTERNAL_API = {
  callbackUrlSms:
    process.env.EXTERNAL_121_SERVICE_URL + 'api/notifications/sms/status',
  callbackUrlVoice:
    process.env.EXTERNAL_121_SERVICE_URL + 'api/notifications/voice/status',
  callbackUrlWhatsapp:
    process.env.EXTERNAL_121_SERVICE_URL + 'api/notifications/whatsapp/status',
  voiceXmlUrl:
    process.env.EXTERNAL_121_SERVICE_URL + 'api/notifications/voice/xml/',
  voiceMp3lUrl:
    process.env.EXTERNAL_121_SERVICE_URL + 'api/notifications/voice/mp3/',
  imageCodeUrl:
    process.env.EXTERNAL_121_SERVICE_URL + 'api/notifications/imageCode/',
  voucherInstructionsUrl:
    process.env.EXTERNAL_121_SERVICE_URL + 'api/fsp/intersolve/instruction/',
};

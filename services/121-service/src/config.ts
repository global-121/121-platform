export const DEBUG =
  ['production', 'test'].indexOf(process.env.NODE_ENV) === -1;
export const PORT = process.env.PORT_121_SERVICE;
export const BASE_PATH = process.env.SUBDOMAIN_121_SERVICE + '/api';
export const SCHEME = process.env.SCHEME === 'http' ? 'http' : 'https';

// Configure Swagger UI appearance:
// ---------------------------------------------------------------------------
export const APP_VERSION = process.env.GLOBAL_121_VERSION;

let appTitle = process.env.npm_package_name;
if (process.env.ENV_NAME) {
  appTitle += ` [${process.env.ENV_NAME}]`;
}
export const APP_TITLE = appTitle;

let headerStyle = '#171e50';
let favIconUrl = '../../favicon.ico';

if (process.env.ENV_ICON) {
  favIconUrl = process.env.ENV_ICON;
  headerStyle = `url("${process.env.ENV_ICON}")`;
}

export const APP_FAVICON = favIconUrl;
export const SWAGGER_CUSTOM_CSS = `
  .swagger-ui .topbar { background: ${headerStyle}; }
  .swagger-ui .topbar .link { visibility: hidden; }
`;

// Configure Internal and External API URL's
// ---------------------------------------------------------------------------

export const API = {
  paAccounts: {
    deleteAccount:
      process.env.URL_PA_ACCOUNTS_SERVICE_API + '/user/get-wallet-and-delete',
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

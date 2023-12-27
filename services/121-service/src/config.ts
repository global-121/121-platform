import packageJson = require('../package.json');

export const DEBUG = !['production', 'test'].includes(process.env.NODE_ENV);
export const PORT = process.env.PORT_121_SERVICE;

const rootUrl =
  process.env.NODE_ENV === 'development'
    ? `http://localhost:${PORT}/`
    : process.env.EXTERNAL_121_SERVICE_URL;

// Configure Swagger UI appearance:
// ---------------------------------------------------------------------------
export const APP_VERSION = process.env.GLOBAL_121_VERSION;

let appTitle = packageJson.name;
if (process.env.ENV_NAME) {
  appTitle += ` [${process.env.ENV_NAME}]`;
}
export const APP_TITLE = appTitle;

let headerStyle = '#171e50';
let favIconUrl = '';

if (process.env.ENV_ICON) {
  favIconUrl = process.env.ENV_ICON;
  headerStyle = `url("${process.env.ENV_ICON}")`;
}

export const APP_FAVICON = favIconUrl;
export const SWAGGER_CUSTOM_CSS = `
  .swagger-ui .topbar { background: ${headerStyle}; }
  .swagger-ui .topbar .link { visibility: hidden; }
`;
export const SWAGGER_CUSTOM_JS = `
const loc = window.location;
const currentUrl = loc.origin + '/';
const envUrl = '${rootUrl}';
if (currentUrl !== envUrl ) {
  loc.replace(loc.href.replace(currentUrl,envUrl));
}
`;

// Configure Internal and External API URL's
// ---------------------------------------------------------------------------

export const API_PATHS = {
  smsStatus: 'notifications/sms/status',
  whatsAppStatus: 'notifications/whatsapp/status',
  whatsAppIncoming: 'notifications/whatsapp/incoming',
  whatsAppStatusTemplateTest: 'notifications/whatsapp/templates',
  imageCode: 'notifications/imageCode/',
  voucherInstructions:
    'financial-service-providers/intersolve-voucher/instructions/',
  safaricomResult: 'payments/safaricom/transaction',
  safaricomQueueTimeout: 'payments/safaricom/timeout',
};
const baseApiUrl = process.env.EXTERNAL_121_SERVICE_URL + 'api/';
export const EXTERNAL_API = {
  baseApiUrl: baseApiUrl,
  root: rootUrl,
  rootApi: `${rootUrl}api`,
  smsStatus: baseApiUrl + API_PATHS.smsStatus,
  whatsAppStatus: baseApiUrl + API_PATHS.whatsAppStatus,
  whatsAppStatusTemplateTest: baseApiUrl + API_PATHS.whatsAppStatusTemplateTest,
  whatsAppIncoming: baseApiUrl + API_PATHS.whatsAppIncoming,
  imageCodeUrl: baseApiUrl + API_PATHS.imageCode,
  safaricomResultUrl: baseApiUrl + API_PATHS.safaricomResult,
  safaricomQueueTimeoutUrl: baseApiUrl + API_PATHS.safaricomQueueTimeout,
};

// Configure Public Twilio Setttings:
// ---------------------------------------------------------------------------
export const TWILIO_SANDBOX_WHATSAPP_NUMBER = '+14155238886';

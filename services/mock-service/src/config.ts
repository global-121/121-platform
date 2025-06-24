import { env } from '@mock-service/src/env';

export const PORT = env.PORT_MOCK_SERVICE;
export const IS_DEVELOPMENT = env.NODE_ENV === 'development';

// Configure Swagger UI appearance:
// ---------------------------------------------------------------------------

export const APP_VERSION = env.GLOBAL_121_VERSION ?? '';

let appTitle = 'Mock-Service';
if (env.ENV_NAME) {
  appTitle += ` [${env.ENV_NAME}]`;
}
export const APP_TITLE = appTitle;

let headerStyle = '#FFA368';
let favIconUrl = '';

if (env.ENV_ICON) {
  favIconUrl = env.ENV_ICON;
  headerStyle = `url("${env.ENV_ICON}")`;
}

export const APP_FAVICON = favIconUrl;

export const SWAGGER_CUSTOM_CSS = `
  .swagger-ui .topbar { background: ${headerStyle}; }
  .swagger-ui .topbar .link { visibility: hidden; }
`;

// Configure Internal and External API URL's
// ---------------------------------------------------------------------------
export const API_PATHS = {
  smsStatus: 'notifications/sms/status',
  whatsAppStatus: 'notifications/whatsapp/status',
  whatsAppIncoming: 'notifications/whatsapp/incoming',
  safaricomTransferCallback: 'fsps/safaricom/transfer-callback',
  safaricomTimeoutCallback: 'fsps/safaricom/timeout-callback',
  onafriqCallback: 'fsps/onafriq/callback',
};

export const EXTERNAL_API_ROOT = `${
  IS_DEVELOPMENT
    ? `http://121-service:${env.PORT_121_SERVICE}`
    : env.EXTERNAL_121_SERVICE_URL
}/api`;

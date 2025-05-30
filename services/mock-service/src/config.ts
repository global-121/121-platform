export const DEVELOPMENT = process.env.NODE_ENV === 'development';
export const PORT = DEVELOPMENT ? process.env.PORT_MOCK_SERVICE : 8080;

// Configure Swagger UI appearance:
// ---------------------------------------------------------------------------

export const APP_VERSION = process.env.GLOBAL_121_VERSION ?? '';

let appTitle = 'Mock-Service';
if (process.env.ENV_NAME) {
  appTitle += ` [${process.env.ENV_NAME}]`;
}
export const APP_TITLE = appTitle;

let headerStyle = '#FFA368';
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

// Configure Internal and External API URL's
// ---------------------------------------------------------------------------
export const API_PATHS = {
  smsStatus: 'notifications/sms/status',
  whatsAppStatus: 'notifications/whatsapp/status',
  whatsAppIncoming: 'notifications/whatsapp/incoming',
  safaricomTransferCallback:
    'financial-service-providers/safaricom/transfer-callback',
  safaricomTimeoutCallback:
    'financial-service-providers/safaricom/timeout-callback',
};

export const EXTERNAL_API_ROOT = `${
  DEVELOPMENT
    ? `http://121-service:${process.env.PORT_121_SERVICE}/`
    : process.env.EXTERNAL_121_SERVICE_URL
}api`;

import packageJson = require('../package.json');

export const DEVELOPMENT = process.env.NODE_ENV === 'development';
export const PORT = DEVELOPMENT ? 3001 : 8080;

export const ROOT_URL = DEVELOPMENT
  ? `http://localhost:${PORT}/`
  : process.env.MOCK_SERVICE_URL;

// Configure Swagger UI appearance:
// ---------------------------------------------------------------------------

export const APP_VERSION = process.env.GLOBAL_121_VERSION!;

let appTitle = packageJson.name;
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
  safaricomCallback: 'payments/safaricom/transaction',
};
const rootApi121Service = DEVELOPMENT
  ? `http://121-service:${process.env.PORT_121_SERVICE}/`
  : process.env.EXTERNAL_121_SERVICE_URL;

export const EXTERNAL_API = {
  rootApi: `${rootApi121Service}api`,
};

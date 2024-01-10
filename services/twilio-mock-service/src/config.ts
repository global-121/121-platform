import packageJson = require('../package.json');

export const PORT = process.env.NODE_ENV === 'development' ? 3001 : 8080;

export const ROOT_URL =
  process.env.NODE_ENV === 'development'
    ? `http://localhost:${PORT}/`
    : process.env.MOCK_TWILIO_URL;

// Configure Swagger UI appearance:
// ---------------------------------------------------------------------------

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
export const SWAGGER_CUSTOM_JS = `
const loc = window.location;
const currentUrl = loc.origin + '/';
const envUrl = '${ROOT_URL}';
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
};
const rootApi121Service =
  process.env.NODE_ENV === 'development'
    ? `http://121-service:${process.env.PORT_121_SERVICE}/`
    : process.env.EXTERNAL_121_SERVICE_URL;

export const EXTERNAL_API = {
  rootApi: `${rootApi121Service}api`,
};

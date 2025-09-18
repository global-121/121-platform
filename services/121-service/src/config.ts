import { env } from '@121-service/src/env';

export const IS_DEVELOPMENT = env.NODE_ENV === 'development';
export const IS_TEST = env.NODE_ENV === 'test';
export const IS_PRODUCTION = env.NODE_ENV === 'production';

// Configure Swagger UI appearance:
// ---------------------------------------------------------------------------
export const APP_VERSION = env.GLOBAL_121_VERSION!;

let appTitle = '121-service';
if (env.ENV_NAME) {
  appTitle += ` [${env.ENV_NAME}]`;
}
if (IS_DEVELOPMENT) {
  appTitle = 'Squagger ' + appTitle;
}
export const APP_TITLE = appTitle;

let headerStyle = '#171e50';
let favIconUrl = '';

if (env.ENV_ICON) {
  favIconUrl = env.ENV_ICON;
  headerStyle = `url("${env.ENV_ICON}")`;
}

export const APP_FAVICON = favIconUrl;
export const SWAGGER_CUSTOM_CSS = `
  .swagger-ui .topbar { background: ${headerStyle}; }
  .swagger-ui .topbar .link { visibility: hidden; }
  .swagger-ui .scheme-container { display: none; }
`;
export const SWAGGER_CUSTOM_JS = `
const loc = window.location;
const currentUrl = loc.origin + '/';
const envUrl = '${env.EXTERNAL_121_SERVICE_URL}/';
// Force Swagger UI to only use the configured external URL, to prevent CORS issues
if (currentUrl !== envUrl ) {
  loc.replace(loc.href.replace(currentUrl,envUrl));
}
// Allow to "collapse all" with Alt+Click on any collapsable heading
document.body.addEventListener('click', (event) => {
  if (!event.altKey) return;
  if (event.target && !!event.target.dataset.isOpen) {
    const opposite = !(event.target.dataset.isOpen === 'true');
    document.querySelectorAll('h3[data-is-open="' + opposite + '"]').forEach(element => element.click());
  }
}, { capture: false, passive: true });
`;

// Configure Internal and External API URL's
// ---------------------------------------------------------------------------

export const API_PATHS = {
  smsStatus: 'notifications/sms/status',
  whatsAppStatus: 'notifications/whatsapp/status',
  whatsAppIncoming: 'notifications/whatsapp/incoming',
  whatsAppStatusTemplateTest: 'notifications/whatsapp/templates',
  imageCode: 'notifications/imageCode/',
  voucherInstructions: 'fsps/intersolve-voucher/instructions/',
};
const rootApi = `${env.EXTERNAL_121_SERVICE_URL}/api`;
export const EXTERNAL_API = {
  rootApi,
  smsStatus: `${rootApi}/${API_PATHS.smsStatus}`,
  whatsAppStatus: `${rootApi}/${API_PATHS.whatsAppStatus}`,
  whatsAppStatusTemplateTest: `${rootApi}/${API_PATHS.whatsAppStatusTemplateTest}`,
  whatsAppIncoming: `${rootApi}/${API_PATHS.whatsAppIncoming}`,
  imageCodeUrl: `${rootApi}/${API_PATHS.imageCode}`,
};

// Configure Public Twilio Setttings:
// ---------------------------------------------------------------------------
export const TWILIO_SANDBOX_WHATSAPP_NUMBER = '+14155238886';

// Throttling presets
// See: https://www.npmjs.com/package/@nestjs/throttler
// ---------------------------------------------------------------------------
export const THROTTLING_LIMIT_GENERIC = {
  default: {
    limit: env.GENERIC_THROTTLING_LIMIT,
    ttl: env.GENERIC_THROTTLING_TTL * 1_000, // TTL needs to be in milliseconds
  },
};
export const THROTTLING_LIMIT_HIGH = {
  default: {
    limit: env.HIGH_THROTTLING_LIMIT,
    ttl: env.HIGH_THROTTLING_TTL * 1_000, // TTL needs to be in milliseconds
  },
};

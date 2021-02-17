import { eventNames } from 'cluster';

export const AUTH_DEBUG = false;
export const PORT = process.env.PORT_PA_ACCOUNTS_SERVICE;
export const BASE_PATH = process.env.SUBDOMAIN_PA_ACCOUNTS_SERVICE + '/api';
export const SCHEME =
  ['production', 'staging', 'test'].indexOf(process.env.NODE_ENV) > -1
    ? 'https'
    : 'http';

export const URL_121_SERVICE = process.env.URL_121_SERVICE_API;

export const URL_USERIMS = 'http://11.0.0.5:50003/api';

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

// Configure Wallet Encryption:
// ---------------------------------------------------------------------------
let _walletPasswordEncryptionKey: string;
if (
  process.env.NODE_ENV == 'production' ||
  process.env.NODE_ENV == 'staging' ||
  process.env.NODE_ENV == 'test'
) {
  _walletPasswordEncryptionKey = process.env.WALLET_PASSWORD_ENCRYPTION_KEY;
  if (!_walletPasswordEncryptionKey && !_walletPasswordEncryptionKey.trim()) {
    console.error(
      `Wallet encryption key is not set in ${process.env.NODE_ENV} environment variable WALLET_PASSWORD_ENCRYPTION_KEY`,
    );
    console.error(`Exiting the app because of the above fatal error!`);
    throw new Error(
      `Wallet encryption key is not set in ${process.env.NODE_ENV} environment variable WALLET_PASSWORD_ENCRYPTION_KEY`,
    );
  }
} else {
  _walletPasswordEncryptionKey = 'hRpJDphwadZkKcIfQmMpm4GpOWE7kkGu';
}
export const walletPasswordEncryptionKey = _walletPasswordEncryptionKey;

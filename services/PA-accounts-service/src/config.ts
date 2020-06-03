import { eventNames } from "cluster";

export const AUTH_DEBUG = false;
export const PORT = process.env.PORT_PA_ACCOUNTS_SERVICE;
export const BASE_PATH = process.env.SUBDOMAIN_PA_ACCOUNTS_SERVICE + '/api';
export const SCHEME =
  ['production', 'staging'].indexOf(process.env.NODE_ENV) > -1
    ? 'https'
    : 'http';

export const URL_121_SERVICE = 'http://11.0.0.7:' + process.env.PORT_121_SERVICE + '/' + process.env.SUBDOMAIN_121_SERVICE + 'api'

export const URL_USERIMS = 'http://11.0.0.5:50003/api';

let _walletPasswordEncryptionKey: string;
if (process.env.NODE_ENV == 'production' || process.env.NODE_ENV == 'staging') {
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

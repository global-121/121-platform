export const AUTH_DEBUG = false;
export const PORT = 3001;
export const SUBDOMAIN =
  ['production', 'staging'].indexOf(process.env.NODE_ENV) > -1
    ? 'PA-accounts/'
    : '';
export const SCHEME =
  ['production', 'staging'].indexOf(process.env.NODE_ENV) > -1
    ? 'https'
    : 'http';

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

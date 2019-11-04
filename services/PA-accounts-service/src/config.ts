export const AUTH_DEBUG = true;
export const PORT = 3001;
export const SUBDOMAIN = ['production', 'staging'].indexOf(process.env.NODE_ENV) > -1 ? 'PA-accounts/' : '';
export const SCHEME = ['production', 'staging'].indexOf(process.env.NODE_ENV) > -1 ? 'https' : 'http';

export const AUTH_DEBUG = true;
export const PORT = 3001;
export const SUBDOMAIN = process.env.NODE_ENV == 'production' ? 'PA-accounts/' : '';
export const SCHEME = process.env.NODE_ENV == 'production' ? 'https' : 'http';

import { env } from '@121-service/src/env';

export const PORTAL_NAME = '121 Portal';
export const SUPPORT_EMAIL = 'support@121.global';
export const LOGIN_URL = env.REDIRECT_PORTAL_URL_HOST;
export const CHANGE_PASSWORD_URL = `${env.REDIRECT_PORTAL_URL_HOST}/change-password`;

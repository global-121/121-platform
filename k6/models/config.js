/* global __ENV */
export default {
  baseUrl: __ENV.EXTERNAL_121_SERVICE_URL
    ? __ENV.EXTERNAL_121_SERVICE_URL.replace(/\/+$/, '') + '/' // This ensures there's exactly one trailing slash
    : 'http://localhost:3000/',
  credentials: {
    username: __ENV.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    password: __ENV.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  },
};

/* global __ENV */
export default {
  baseUrl: __ENV.EXTERNAL_121_SERVICE_URL || 'http://localhost:3000/',
  credentials: {
    username: __ENV.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    password: __ENV.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  },
};

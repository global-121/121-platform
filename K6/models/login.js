import http from 'k6/http';

const baseUrl = __ENV.API_BASE_URL || 'http://localhost:3000';

export default class loginModel
{
  constructor() {}
  login() {
    const url = `${baseUrl}/api/users/login`;
    const payload = JSON.stringify({
      username: __ENV.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
      password: __ENV.USERCONFIG_121_SERVICE_PASSWORD_ADMIN
    });
    const params = {
      headers: {
        'Content-Type': 'application/json',
      },
    };
    const res = http.post(url, payload, params);
    return res;
  }
}

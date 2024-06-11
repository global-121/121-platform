import http from 'k6/http';

const baseUrl = __ENV.API_BASE_URL || 'http://localhost:3000';

export default class loginModel
{
  constructor() {}
  createPayment() {
    const url = `${baseUrl}/api/users/login`;
    const payload = JSON.stringify({
      username: "admin@example.org",
      password: "password"
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

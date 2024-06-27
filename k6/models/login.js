import http from 'k6/http';

import config from './config.js';
const { baseUrl, credentials } = config;

export default class loginModel {
  constructor() {}

  login() {
    const url = `${baseUrl}api/users/login`;
    const payload = JSON.stringify(credentials);
    const params = {
      headers: {
        'Content-Type': 'application/json',
      },
    };
    const res = http.post(url, payload, params);
    return res;
  }
}

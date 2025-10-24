import http from 'k6/http';

import config from './config.js';
const { baseUrl } = config;

export default class ResetModel {
  resetDBMockRegistrations(
    powerNumberRegistrations,
    resetIdentifier,
    timeout = '180s',
  ) {
    const url = `${baseUrl}api/scripts/reset?isApiTests=true&script=nlrc-multiple-mock-data&mockPowerNumberRegistrations=${powerNumberRegistrations}&mockPv=true&mockOcw=true&resetIdentifier=${resetIdentifier}`;
    const payload = JSON.stringify({
      secret: 'fill_in_secret',
    });
    const params = {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout,
    };
    const res = http.post(url, payload, params);
    return res;
  }

  kill121Service() {
    const url = `${baseUrl}api/test/kill-service`;
    const payload = JSON.stringify({
      secret: 'fill_in_secret',
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

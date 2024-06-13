import http from 'k6/http';

const baseUrl = __ENV.API_BASE_URL || 'http://localhost:3000';

export default class resetModel {
  constructor() {}
  resetDBMockRegistrations(powerNumberRegistrations, timeout = '60s') {
    const url = `${baseUrl}/api/scripts/reset?mockPowerNumberRegistrations=${powerNumberRegistrations}&mockPv=true&mockOcw=true&isApiTests=false&script=nlrc-multiple-mock-data`;
    const payload = JSON.stringify({
      secret: 'fill_in_secret',
    });
    const params = {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: timeout,
    };
    const res = http.post(url, payload, params);
    return res;
  }

  resetDB() {
    const url = `${baseUrl}/api/scripts/reset?mockPv=true&mockOcw=true&isApiTests=false&script=nlrc-multiple`;
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

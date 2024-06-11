import http from 'k6/http';

export default class resetModel
{
  constructor() {}
  resetDB(powerNumberRegistrations) {
    const url = `http://localhost:3000/api/scripts/reset?mockPowerNumberRegistrations=${powerNumberRegistrations}&mockPv=true&mockOcw=true&isApiTests=false&script=nlrc-multiple-mock-data`;
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

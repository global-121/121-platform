import http from 'k6/http';

const baseUrl = __ENV.API_BASE_URL || 'http://localhost:3000';

export default class paymentsModel
{
  constructor() {}
  createPayment(programId) {
    const url = `${baseUrl}/api/programs/${programId}/payments`;
    const payload = JSON.stringify({
      payment: 3,
      amount: 10,
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

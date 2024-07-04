import { sleep } from 'k6';
import http from 'k6/http';

import config from './config.js';
const { baseUrl } = config;

export default class paymentsModel {
  constructor() {}
  createPayment(programId) {
    const url = `${baseUrl}api/programs/${programId}/payments`;
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

  getPaymentResults(programId, paymentNr, totalAmountPowerOfTwo, passRate) {
    const maxAttempts = 60;
    let attempts = 0;
    let successPercentage = 0;

    while (attempts < maxAttempts) {
      const url = `${baseUrl}api/programs/${programId}/payments/${paymentNr}`;
      const res = http.get(url);
      const responseBody = JSON.parse(res.body);
      const totalPayments = Math.pow(2, totalAmountPowerOfTwo);
      successPercentage =
        (parseInt(responseBody.nrSuccess) / totalPayments) * 100;

      if (successPercentage >= passRate) {
        console.log(
          `Success: The percentage of successful payments (${successPercentage}%) is at or above the pass rate (${passRate}%).`,
        );
        return res;
      }
      attempts++;
      sleep(5);
    }

    throw new Error(
      `Failed to reach the pass rate of ${passRate}%. Instead, the pass rate was ${successPercentage}%.`,
    );
  }
}

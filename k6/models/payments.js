import { sleep } from 'k6';
import http from 'k6/http';

import config from './config.js';
const { baseUrl } = config;

export default class paymentsModel {
  createPayment(projectId, amount) {
    const url = `${baseUrl}api/projects/${projectId}/payments`;
    const payload = JSON.stringify({
      amount,
    });
    const params = {
      headers: {
        'Content-Type': 'application/json',
      },
    };
    // TODO: this fails 1/10 times
    const res = http.post(url, payload, params);
    return res;
  }

  getPaymentResults(
    projectId,
    maxTimeoutAttempts,
    paymentId,
    totalAmountPowerOfTwo,
    passRate,
  ) {
    const status = 'success';
    const maxAttempts = maxTimeoutAttempts;
    let attempts = 0;
    let selectedStatusPercentage = 0;

    while (attempts < maxAttempts) {
      const url = `${baseUrl}api/projects/${projectId}/payments/${paymentId}`;
      const res = http.get(url);
      const responseBody = JSON.parse(res.body);
      const totalPayments = Math.pow(2, totalAmountPowerOfTwo);
      selectedStatusPercentage =
        (parseInt(responseBody[status].count) / totalPayments) * 100;

      if (selectedStatusPercentage >= passRate) {
        console.log(
          `Success: The percentage of successful payments (${selectedStatusPercentage}%) is at or above the pass rate (${passRate}%).`,
        );
        return res;
      }
      attempts++;
      sleep(5);
    }

    return {
      status: 500,
      body: JSON.stringify({
        error: `Failed after ${maxAttempts} attempts without reaching the pass rate of ${passRate}%. Last recorded pass rate was ${selectedStatusPercentage}%.`,
      }),
    };
  }
}

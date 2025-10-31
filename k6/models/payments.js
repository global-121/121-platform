import { sleep } from 'k6';
import http from 'k6/http';

import config from './config.js';
const { baseUrl } = config;

export default class PaymentsModel {
  createAndStartPayment(programId, amount) {
    const urlCreate = `${baseUrl}api/programs/${programId}/payments`;
    const payloadCreate = JSON.stringify({
      transferValue: amount,
    });
    const paramsCreate = {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: '600s', // sometimes this request takes a while, especially on GH actions
    };
    const resCreate = http.post(urlCreate, payloadCreate, paramsCreate);
    console.log('res: ', JSON.parse(resCreate.body));
    const paymentId = JSON.parse(resCreate.body).id;
    console.log('paymentId: ', paymentId);

    sleep(5);

    const urlStart = `${baseUrl}api/programs/${programId}/payments/${paymentId}`;
    const payloadStart = JSON.stringify({});
    const paramsStart = {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: '600s', // sometimes this request takes a while, especially on GH actions
    };
    const resStart = http.patch(urlStart, payloadStart, paramsStart);
    return resStart;
  }

  getPaymentResults(
    programId,
    maxRetryDuration,
    paymentId,
    totalAmountPowerOfTwo,
    passRate,
  ) {
    const totalPayments = Math.pow(2, totalAmountPowerOfTwo);
    const delayBetweenAttempts = 5; // seconds
    let attempts = 0;
    let successfulPaymentsPercentage = 0;

    while (attempts * delayBetweenAttempts < maxRetryDuration) {
      const url = `${baseUrl}api/programs/${programId}/payments/${paymentId}`;
      const res = http.get(url);
      const responseBody = JSON.parse(res.body);
      const successfulPaymentsCount = parseInt(
        (responseBody &&
          responseBody['success'] &&
          responseBody['success'].count) ||
          '0',
      );

      successfulPaymentsPercentage =
        (parseInt(successfulPaymentsCount) / totalPayments) * 100;

      console.log(
        `Payment results attempt #${attempts + 1} [target ${passRate}% - current ${successfulPaymentsPercentage.toFixed(2)}%]: ${successfulPaymentsCount} out of ${totalPayments} payments successful`,
      );

      if (successfulPaymentsPercentage >= passRate) {
        console.log(
          `Success: The percentage of successful payments (${successfulPaymentsPercentage}%) is at or above the pass rate (${passRate}%).`,
        );
        return res;
      }

      attempts++;
      sleep(delayBetweenAttempts);
    }

    console.log(
      `Failed: The percentage of successful payments (${successfulPaymentsPercentage}%) did not reach the pass rate (${passRate}%) within the maximum retry duration of ${maxRetryDuration} seconds.`,
    );

    return {
      status: 500,
    };
  }
}

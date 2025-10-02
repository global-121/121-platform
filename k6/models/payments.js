import { sleep } from 'k6';
import http from 'k6/http';

import config from './config.js';
const { baseUrl } = config;

export default class PaymentsModel {
  verifyPaymentDryRun(programId) {
    const url = `${baseUrl}api/programs/${programId}/payments?dryRun=true`;
    const params = {
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
    };
    const res = http.post(url, null, params);
    return res;
  }

  createPayment(programId, amount) {
    const url = `${baseUrl}api/programs/${programId}/payments`;
    const payload = JSON.stringify({
      amount,
    });
    const params = {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: '600s', // sometimes this request takes a while, especially on GH actions
    };
    // TODO: this fails 1/10 times
    const res = http.post(url, payload, params);
    return res;
  }

  waitForPaymentSuccessRate(
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
        responseBody?.['success']?.count || '0',
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

  verifyPaymentDryRunUntilSuccess(programId, maxRetryDuration = 10) {
    const delayBetweenAttempts = 1; // seconds
    let attempts = 0;
    while (attempts * delayBetweenAttempts < maxRetryDuration) {
      console.log(
        `Attempt ${attempts + 1} to verify payment dry run for programId: ${programId}`,
      );
      const result = this.verifyPaymentDryRun(programId);
      if (!result.status || result.status === 200) {
        console.log(`Payment dry run successful on attempt ${attempts + 1}`);
        return result;
      }
      attempts++;
      sleep(delayBetweenAttempts);
    }
    throw new Error(
      `Failed to verify payment dry run after ${maxRetryDuration} seconds for programId: ${programId}`,
    );
  }
}

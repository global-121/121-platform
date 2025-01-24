import { check, fail, sleep } from 'k6';
import { Counter } from 'k6/metrics';

import { registrationVisa } from '../helpers/registration-default.data.js';
import InitializePaymentModel from '../models/initalize-payment.js';

const initializePayment = new InitializePaymentModel();

const duplicateNumber = 10; // '17' leads to 131k registrations
const resetScript = 'nlrc-multiple';
const programId = 3;
const paymentId = 3;
const maxTimeoutAttempts = 1;
const minPassRatePercentage = 5;

export const options = {
  thresholds: {
    http_req_failed: ['rate<0.01'], // http errors should be less than 1%
    failed_checks: ['count<1'], // fail the test if any check fails
  },
  vus: 1,
  duration: '30s',
  iterations: 1,
};

const failedChecks = new Counter('failed_checks');

function checkAndFail(response, checks) {
  const result = check(response, checks);
  if (!result) {
    failedChecks.add(1);
    fail('One or more checks failed');
  }
}

export default function () {
  const monitorPayment = initializePayment.initializePayment(
    resetScript,
    programId,
    registrationVisa,
    duplicateNumber,
    paymentId,
    maxTimeoutAttempts,
    minPassRatePercentage,
  );
  checkAndFail(monitorPayment, {
    'Payment progressed successfully status 200': (r) => {
      if (r.status != 200) {
        const responseBody = JSON.parse(r.body);
        console.log('responseBody: ', responseBody);
        console.log('status: ', r.status);
        console.log(responseBody.error || r.status);
      }
      console.log('status: ', r.status);
      return r.status == 200;
    },
  });

  sleep(1);
}

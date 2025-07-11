import { check, fail, sleep } from 'k6';
import { Counter } from 'k6/metrics';

import { registrationOnafriq } from '../helpers/registration-default.data.js';
import InitializePaymentModel from '../models/initalize-payment.js';

const initializePayment = new InitializePaymentModel();

const duplicateNumber = 17; // '17' leads to 131k registrations
const resetScript = 'onafriq-program';
const programId = 1;
const paymentNr = 3;
const maxTimeoutAttempts = 800;
const status = 'success';
const minPassRatePercentage = 10;
const amount = 10;

export const options = {
  thresholds: {
    http_req_failed: ['rate<0.01'], // http errors should be less than 1%
    failed_checks: ['count<1'], // fail the test if any check fails
  },
  vus: 1,
  duration: '80m',
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
    registrationOnafriq,
    duplicateNumber,
    maxTimeoutAttempts,
    status,
    minPassRatePercentage,
    paymentNr,
    amount,
  );
  checkAndFail(monitorPayment, {
    'Payment progressed successfully status 200': (r) => {
      if (r.status != 200) {
        const responseBody = JSON.parse(r.body);
        console.log(responseBody.error || r.status);
      }
      return r.status == 200;
    },
  });

  sleep(1);
}

import { check, sleep } from 'k6';

import { registrationVisa } from '../helpers/registration-default.data.js';
import InitializePaymentModel from '../models/initalize-payment.js';

const initializePayment = new InitializePaymentModel();

const duplicateNumber = 17; // '17' leads to 131k registrations
const resetScript = 'nlrc-multiple';
const programId = 3;
const paymentId = 3;
const maxTimeoutAttempts = 200;
const minPassRatePercentage = 10;

export const options = {
  thresholds: {
    http_req_failed: ['rate<0.01'], // http errors should be less than 1%
  },
  vus: 1,
  duration: '20m',
  iterations: 1,
};

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
  check(monitorPayment, {
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

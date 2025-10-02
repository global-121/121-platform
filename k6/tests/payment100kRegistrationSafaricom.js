/* global __ENV */
import { check, fail, sleep } from 'k6';
import { Counter } from 'k6/metrics';

import { registrationSafaricom } from '../helpers/registration-default.data.js';
import PaymentSetupAndValidationModel from '../models/payment-setup-and-validation.js';

// For now we decided to k6 test only Safaricom and IntersolveVisa
// The reasoning behind this is that IntersolveVisa has the most complex logic and most API calls
// Safaricom is one of the payment providers which uses callbacks and therefore also has heavier/more complex
// The other FSPs are simpler or similar to Safaricom so we decided to not test them

const paymentSetupAndValidationModel = new PaymentSetupAndValidationModel();

const duplicateNumber = parseInt(__ENV.DUPLICATE_NUMBER || '5'); // '17' leads to 131k registrations
const resetScript = 'safari-program';
const programId = 1;
const maxRetryDuration = 4000; // seconds
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
  const monitorPayment =
    paymentSetupAndValidationModel.setupAndValidatePaymentSuccessPercentage(
      resetScript,
      'payment100kRegistrationSafaricom.js',
      programId,
      registrationSafaricom,
      duplicateNumber,
      maxRetryDuration,
      minPassRatePercentage,
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

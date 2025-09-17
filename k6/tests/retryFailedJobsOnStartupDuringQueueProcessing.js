/* global __ENV */
import { check, fail, sleep } from 'k6';
import http from 'k6/http';
import { Counter } from 'k6/metrics';

import config from '../models/config.js';
import loginModel from '../models/login.js';
import PaymentsModel from '../models/payments.js';
import resetModel from '../models/reset.js';

const { baseUrl } = config;

const resetPage = new resetModel();
const paymentsPage = new PaymentsModel();
const loginPage = new loginModel();

const duplicateNumber = parseInt(__ENV.DUPLICATE_NUMBER || '7'); // '7' leads to 128 registrations
const programId = 3;
const maxTimeoutAttempts = 400;
const minPassRatePercentage = 100;
const amount = 10;

export const options = {
  thresholds: {
    // In this case the health check runs multiple times and so of the responses are going to be 500 before service is up
    http_req_failed: ['rate<0.40'], // http errors should be less than 40%
    failed_checks: ['count<1'], // fail the test if any check fails
  },
  vus: 1,
  duration: '60m',
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

function isServiceUp() {
  const response = http.get(`${baseUrl}api/health/health`);
  return response.status === 200;
}

export default function () {
  // reset db
  const reset = resetPage.resetDBMockRegistrations(duplicateNumber);
  checkAndFail(reset, {
    'Reset succesfull status was 202': (r) => r.status == 202,
  });

  // login
  const login = loginPage.login();
  checkAndFail(login, {
    'Login succesfull status was 200': (r) => r.status == 201,
    'Login time is less than 200ms': (r) => {
      if (r.timings.duration >= 200) {
        console.log(`Login time was ${r.timings.duration}ms`);
      }
      return r.timings.duration < 200;
    },
  });

  // Do the payment
  const doPayment = paymentsPage.createPayment(programId, amount);
  checkAndFail(doPayment, {
    'Payment successfully done status 202': (r) => {
      if (r.status != 202) {
        console.log(r.body);
      }
      return r.status == 202;
    },
  });

  sleep(5); // wait long enough so that jobs are added to the queue, but not so long that all are processed already

  resetPage.kill121Service();

  // Wait for the service to restart and become available
  let serviceUp = false;
  while (!serviceUp) {
    sleep(1); // Wait for 1 second before pinging again
    serviceUp = isServiceUp();
  }

  // Monitor that 100% of payments is successful and then stop the test
  const monitorPayment = paymentsPage.getPaymentResults(
    programId,
    maxTimeoutAttempts,
    doPayment.body.id,
    duplicateNumber,
    minPassRatePercentage,
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
}

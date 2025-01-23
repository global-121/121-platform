import { check, fail, sleep } from 'k6';
import http from 'k6/http';
import { Counter } from 'k6/metrics';

import loginModel from '../models/login.js';
import paymentsModel from '../models/payments.js';
import resetModel from '../models/reset.js';

const resetPage = new resetModel();
const paymentsPage = new paymentsModel();
const loginPage = new loginModel();

const duplicateNumber = 7;
const programId = 3;
const paymentId = 3;
const maxTimeoutAttempts = 400;
const minPassRatePercentage = 100;
const amount = 10;

export const options = {
  thresholds: {
    // HTTP failures should be less than 30%
    http_req_failed: [{ threshold: 'rate<0.30', abortOnFail: true }],
    // Custom threshold for failed checks
    failed_checks: [{ threshold: 'count<1', abortOnFail: true }],
  },
  vus: 1,
  duration: '60m',
  iterations: 1,
};

const failedRequests = new Counter('failed_requests');
const failedChecks = new Counter('failed_checks');

function trackFailedRequest(response) {
  if (response.error_code) {
    console.error(
      `HTTP request failed with error code: ${response.error_code}`,
    );
    failedRequests.add(1); // Increment failed requests
  }
}

function checkAndFail(response, checks) {
  const result = check(response, checks);
  if (!result) {
    failedChecks.add(1);
    fail('One or more checks failed');
  }
}

function isServiceUp() {
  const response = http.get('http://localhost:3000/api/health/health');
  trackFailedRequest(response);
  return response.status === 200;
}

export default function () {
  // reset db
  const reset = resetPage.resetDBMockRegistrations(duplicateNumber);
  checkAndFail(reset, {
    'Reset successful, status is 202': (r) => r.status === 202,
  });
  // login
  const login = loginPage.login();
  checkAndFail(login, {
    'Login successful, status is 201': (r) => r.status === 201,
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
    'Payment successfully done, status is 202': (r) => {
      if (r.status !== 202) {
        console.log(`Payment response body: ${r.body}`);
      }
      return r.status === 202;
    },
  });

  sleep(5); // wait long enough so that jobs are added to the queue, but not so long that all are processed already

  resetPage.kill121Service();

  // Wait for the service to become available again
  let serviceUp = false;
  while (!serviceUp) {
    sleep(1); // Wait 1 second before checking again
    serviceUp = isServiceUp();
  }

  // Monitor that 100% of payments is successful and then stop the test
  const monitorPayment = paymentsPage.getPaymentResults(
    programId,
    maxTimeoutAttempts,
    paymentId,
    duplicateNumber,
    minPassRatePercentage,
  );
  checkAndFail(monitorPayment, {
    'Payment progress successful, status is 200': (r) => {
      if (r.status !== 200) {
        const responseBody = JSON.parse(r.body);
        console.log(`Error: ${responseBody.error || r.status}`);
      }
      return r.status === 200;
    },
  });
}

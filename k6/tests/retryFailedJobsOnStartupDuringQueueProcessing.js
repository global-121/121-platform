import { check, sleep } from 'k6';
import http from 'k6/http';

import loginModel from '../models/login.js';
import paymentsModel from '../models/payments.js';
import resetModel from '../models/reset.js';

const resetPage = new resetModel();
const paymentsPage = new paymentsModel();
const loginPage = new loginModel();

const duplicateNumber = 7; // This leads to 128 registrations
const programId = 3;
const paymentId = 3;
const maxTimeoutAttempts = 400;
const minPassRatePercentage = 100;
const amount = 10;

export const options = {
  vus: 1,
  duration: '40m',
  iterations: 1,
};

function isServiceUp() {
  const response = http.get('http://localhost:3000/api/health/health'); // Replace with your health check endpoint
  return response.status === 200;
}

export default function () {
  // reset db
  const reset = resetPage.resetDBMockRegistrations(duplicateNumber);
  check(reset, {
    'Reset succesfull status was 202': (r) => r.status == 202,
  });

  // login
  const login = loginPage.login();
  check(login, {
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
  check(doPayment, {
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
    paymentId,
    duplicateNumber,
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
}

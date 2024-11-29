import { check, sleep } from 'k6';

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

export const options = {
  vus: 1,
  duration: '40m',
  iterations: 1,
};

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
  const doPayment = paymentsPage.createPayment(programId);
  check(doPayment, {
    'Payment successfully done status 202': (r) => {
      if (r.status != 202) {
        console.log(r.body);
      }
      return r.status == 202;
    },
  });

  sleep(5); // wait long enough so that jobs are added to the queue

  resetPage.kill121Service();

  sleep(5); // wait long enough so that 121-service is back up

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

  sleep(1);
}

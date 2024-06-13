import { sleep, check } from 'k6';
import resetModel from '../models/reset.js';
import loginModel from '../models/login.js';
import paymentsModel from '../models/payments.js';

const paymentsPage = new paymentsModel();
const resetPage = new resetModel();
const loginPage = new loginModel();

export const options = {
  thresholds: {
    http_req_failed: ['rate<0.01'], // http errors should be less than 1%
  },
  vus: 1,
};

export default function () {
  // reset db
  const reset = resetPage.resetDBMockRegistrations(17, '7m');
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

  // do the payment
  const payment = paymentsPage.createPayment(3);
  console.log(payment.body);
  check(payment, {
    'Payment succesfull status was 202': (r) => r.status == 202,
  });

  sleep(1);
}

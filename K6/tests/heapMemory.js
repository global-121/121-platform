import { sleep, check } from 'k6';
import resetModel from '../models/reset.js';
import paymentsModel from '../models/payments.js';
import loginModel from '../models/login.js';
import programsModel from '../models/programs.js';

const resetPage = new resetModel();
const paymentsPage = new paymentsModel();
const loginPage = new loginModel();
const programsPage = new programsModel();

export const options = {
  thresholds: {
    http_req_failed: ['rate<0.01'], // http errors should be less than 1%
  },
  vus: 1,
};

export default function () {
  // reset db
  const reset = resetPage.resetDB('15');
  check(reset, {
    'Reset succesfull status was 202': (r) => r.status == 202,
    'Reset time is less than 35000ms': (r) => {
      if (r.timings.duration >= 35000) {
        console.log(`Reset time was ${r.timings.duration}ms`);
      }
      return r.timings.duration < 35000;
    },
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

  // create payment
  const payment = paymentsPage.createPayment('3');
  check(payment, {
    'Payment succesfull status was 202': (r) => r.status == 202,
    'Payment time is less than 400ms': (r) => {
      if (r.timings.duration >= 400) {
        console.log(`Payment time was ${r.timings.duration}ms`);
      }
      return r.timings.duration < 400;
    },
  });

  // send bulk message
  const message = programsPage.sendBulkMessage(3);
  check(message, {
    'Message succesfull status was 202': (r) => r.status == 202,
    'Message time is less than 400ms': (r) => {
      if (r.timings.duration >= 400) {
        console.log(`Message time was ${r.timings.duration}ms`);
      }
      return r.timings.duration < 400;
    },
  });

  sleep(1);
}

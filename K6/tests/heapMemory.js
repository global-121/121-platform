import { sleep, check } from 'k6';
import resetModel from '../models/reset.js';
import paymentsModel from '../models/payments.js';
import loginModel from '../models/login.js';
import programsModel from '../models/programs.js';
import metricstsModel from '../models/metrics.js';

const resetPage = new resetModel();
const paymentsPage = new paymentsModel();
const loginPage = new loginModel();
const programsPage = new programsModel();
const metricsPage = new metricstsModel();

export const options = {
  thresholds: {
    http_req_failed: ['rate<0.01'], // http errors should be less than 1%
  },
  vus: 1,
};

export default function () {
  // reset db
  const reset = resetPage.resetDBMockRegistrations(15);
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

  // create payment
  const payment = paymentsPage.createPayment(3);
  check(payment, {
    'Payment succesfull status was 202': (r) => r.status == 202,
  });

  // get export list
  const exportList = metricsPage.getExportList(3);
  check(exportList, {
    'Export list loaded succesfully status was 200': (r) => r.status == 200,
  });

  // send bulk message
  const message = programsPage.sendBulkMessage(3);
  check(message, {
    'Message sent succesfully status was 202': (r) => r.status == 202,
  });

  sleep(1);
}

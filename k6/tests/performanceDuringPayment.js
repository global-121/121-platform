import { check, fail, sleep } from 'k6';
import { Counter } from 'k6/metrics';

import loginModel from '../models/login.js';
import metricstsModel from '../models/metrics.js';
import paymentsModel from '../models/payments.js';
import projectsModel from '../models/projects.js';
import resetModel from '../models/reset.js';

const resetPage = new resetModel();
const paymentsPage = new paymentsModel();
const loginPage = new loginModel();
const projectsPage = new projectsModel();
const metricsPage = new metricstsModel();

const duplicateNumber = 5;
const projectId = 3;
const maxTimeoutAttempts = 600;
const minPassRatePercentage = 50;
const amount = 11.11;

export const options = {
  thresholds: {
    http_req_failed: ['rate<0.01'], // http errors should be less than 1%
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
  const doPayment = paymentsPage.createPayment(projectId, amount);
  checkAndFail(doPayment, {
    'Payment successfully done status 202': (r) => {
      if (r.status != 202) {
        console.log(r.body);
      }
      return r.status == 202;
    },
  });

  // Monitor that 100% of payments is successful and then stop the test
  const monitorPayment = paymentsPage.getPaymentResults(
    projectId,
    maxTimeoutAttempts,
    doPayment.body.id,
    duplicateNumber,
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

  // get export list
  const exportList = metricsPage.getExportList(3);
  checkAndFail(exportList, {
    'Export list loaded succesfully status was 200': (r) => r.status == 200,
  });

  // send bulk message
  const message = projectsPage.sendBulkMessage(3);
  checkAndFail(message, {
    'Message sent succesfully status was 202': (r) => r.status == 202,
  });

  sleep(1);
}

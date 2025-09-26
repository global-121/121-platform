/* global __ENV */
import { check, fail, sleep } from 'k6';
import { Counter } from 'k6/metrics';

import { registrationVisa } from '../helpers/registration-default.data.js';
import LoginModel from '../models/login.js';
import paymentsModel from '../models/payments.js';
import ProgramsModel from '../models/programs.js';
import RegistrationsModel from '../models/registrations.js';
import ResetModel from '../models/reset.js';

const resetPage = new ResetModel();
const loginPage = new LoginModel();
const programsPage = new ProgramsModel();
const paymentsPage = new paymentsModel();
const registrationsPage = new RegistrationsModel();

const resetScript = 'nlrc-multiple';
const duplicateNumber = parseInt(__ENV.DUPLICATE_NUMBER || '15'); // should be 15
const programId = 3;
const maxRetryDuration = 3000; // seconds
const minPassRatePercentage = 10;
const amount = 10;

export const options = {
  thresholds: {
    http_req_failed: ['rate<0.04'], // http errors should be less than 4%
    failed_checks: ['count<1'], // fail the test if any check fails
  },
  vus: 1,
  duration: '20m',
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
  // REFACTOR: this test requires the same setup as getProgramWithManyAttributes.js. Move setup code to shared place.
  // reset db
  const reset = resetPage.resetDB(resetScript, __filename);
  checkAndFail(reset, {
    'Reset successful status was 202': (r) => r.status == 202,
  });

  // login
  const login = loginPage.login();
  checkAndFail(login, {
    'Login successful. Status was 201': (r) => r.status == 201,
    'Login time is less than 200ms': (r) => {
      if (r.timings.duration >= 200) {
        console.log(`Login time was ${r.timings.duration}ms`);
      }
      return r.timings.duration < 200;
    },
  });

  // add 50 program registration attributes to generate a bigger load
  for (let i = 1; i <= 50; i++) {
    const attributeName = `attribute${i}`;
    const programRegistrationAttributes =
      programsPage.createProgramRegistrationAttribute(programId, attributeName);
    registrationVisa[attributeName] = 'bla';

    checkAndFail(programRegistrationAttributes, {
      'Program registration attributes added successfully status was 201': (
        r,
      ) => {
        if (r.status != 201) {
          console.log(r.body);
        }
        return r.status == 201;
      },
    });
  }

  // Upload registration
  const registrationImport = registrationsPage.importRegistrations(
    programId,
    registrationVisa,
  );
  checkAndFail(registrationImport, {
    'Import of registration successful status was 201': (r) => r.status == 201,
  });

  // Duplicate registrations between 20k - 50k
  const duplicateRegistration =
    resetPage.duplicateRegistrations(duplicateNumber);
  checkAndFail(duplicateRegistration, {
    'Duplication successful status was 201': (r) => r.status == 201,
  });

  // get program by id and validate load time is less than 200ms
  const program = programsPage.getProgramById(programId);
  checkAndFail(program, {
    'Program loaded successfully status was 200': (r) => r.status == 200,
    'Program load time is less than 200ms': (r) => {
      if (r.timings.duration >= 200) {
        console.log(`Programme time was ${r.timings.duration}ms`);
      }
      return r.timings.duration < 200;
    },
  });

  // Change status of all PAs to included and check response
  const responseIncluded = programsPage.updateRegistrationStatusAndLog(
    programId,
    'included',
  );
  checkAndFail(responseIncluded, {
    'Status successfully changed to included: 202': (r) => {
      if (r.status != 202) {
        console.log(r.body);
      }
      return r.status == 202;
    },
  });

  // Do the payment with dryRun first
  paymentsPage.verifyPaymentDryRunUntilSuccess(programId, amount);
  const doPayment = paymentsPage.createPayment(programId, amount);
  checkAndFail(doPayment, {
    'Payment successfully done status 202': (r) => {
      if (r.status !== 202) {
        console.log('Payment failed with status:', r.status);
        console.log(r.body);
      } else {
        console.log('Payment initiated, payment id:', JSON.parse(r.body).id);
      }
      return r.status === 202;
    },
    'Payment contains a valid id': (r) => {
      return r.body && JSON.parse(r.body).id;
    },
  });

  // Monitor that 10% of payments is successful and then stop the test
  const paymentId = JSON.parse(doPayment.body).id;
  const monitorPayment = paymentsPage.getPaymentResults(
    programId,
    maxRetryDuration,
    paymentId,
    duplicateNumber,
    minPassRatePercentage,
  );
  checkAndFail(monitorPayment, {
    'Payment progressed successfully status 200': (r) => {
      if (r.status !== 200) {
        const responseBody = JSON.parse(r.body);
        console.log('Payment monitoring failed with status:', r.status);
        console.log(responseBody.error);
      }
      return r.status === 200;
    },
  });

  sleep(1);
}

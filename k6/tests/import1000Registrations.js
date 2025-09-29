import { check, fail, sleep } from 'k6';
import { Counter } from 'k6/metrics';

import LoginModel from '../models/login.js';
import RegistrationsModel from '../models/registrations.js';
import ResetModel from '../models/reset.js';

const resetPage = new ResetModel();
const loginPage = new LoginModel();
const registrationsPage = new RegistrationsModel();

const resetScript = 'test-multiple';
const programId = 2;

const csvFilePath =
  '../../e2e/test-registration-data/test-registrations-westeros-1000.csv';

// Somehow this works, but is not recognized. If importing 'open' from k6 above instead, it will not work.
// eslint-disable-next-line no-undef
const csvFile = open(csvFilePath); // open() only works here in 'init' stage of k6 test
if (!csvFile) {
  throw new Error(`File not found: ${csvFilePath}`);
}

export const options = {
  thresholds: {
    http_req_failed: ['rate<0.01'], // http errors should be less than 1%
    failed_checks: ['count<1'], // fail the test if any check fails
  },
  vus: 1,
  iterations: 1,
  // REFACTOR: should we investigate if the duration can be reduced?
  duration: '9m', // At the time of writing this test, this test took ~7m both locally and on GH actions. Setting the limit to 9m, so it's below the API timeout limit of10m. Change this value only deliberately. If the tests takes longer because of regression effects, it should fail.
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
  const reset = resetPage.resetDB(resetScript);
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

  // Upload registrations
  const registrationImport = registrationsPage.importRegistrationsCsv(
    programId,
    csvFile,
  );
  checkAndFail(registrationImport, {
    'Import of registration successful status was 201': (r) => r.status == 201,
  });

  sleep(1);
}

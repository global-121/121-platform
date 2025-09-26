/* global __ENV */
import { check, fail, sleep } from 'k6';
import { Counter } from 'k6/metrics';

import { registrationVisa } from '../helpers/registration-default.data.js';
import loginModel from '../models/login.js';
import programsModel from '../models/programs.js';
import RegistrationsModel from '../models/registrations.js';
import resetModel from '../models/reset.js';

const resetPage = new resetModel();
const loginPage = new loginModel();
const programsPage = new programsModel();
const registrationsPage = new RegistrationsModel();

const resetScript = 'nlrc-multiple';
const duplicateNumber = parseInt(__ENV.DUPLICATE_NUMBER || '5');
const programId = 2;

export const options = {
  thresholds: {
    http_req_failed: ['rate<0.01'], // http errors should be less than 1%
    failed_checks: ['count<1'], // fail the test if any check fails
  },
  vus: 1,
  duration: '30s',
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
  const reset = resetPage.resetDB(resetScript, __filename);
  checkAndFail(reset, {
    'Reset successful. Status was 202': (r) => r.status == 202,
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

  // Duplicate registration
  const duplicateRegistration =
    resetPage.duplicateRegistrations(duplicateNumber);
  checkAndFail(duplicateRegistration, {
    'Duplication successful status was 201': (r) => r.status == 201,
  });

  // get program by id and validate load time is less than 200ms
  const program = programsPage.getProgramById(2);
  checkAndFail(program, {
    'Program loaded successfully status was 200': (r) => r.status == 200,
    'Program load time is less than 200ms': (r) => {
      if (r.timings.duration >= 200) {
        console.log(`Programme time was ${r.timings.duration}ms`);
      }
      return r.timings.duration < 200;
    },
  });

  sleep(1);
}

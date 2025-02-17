import { check, fail, sleep } from 'k6';
import { Counter } from 'k6/metrics';

import { registrationPV } from '../helpers/registration-default.data.js';
import loginModel from '../models/login.js';
import RegistrationsModel from '../models/registrations.js';
import resetModel from '../models/reset.js';

const registrationsModel = new RegistrationsModel();
const resetPage = new resetModel();
const loginPage = new loginModel();

const duplicateNumber = 17; // '17' leads to 131k registrations
const resetScript = 'nlrc-multiple';
const programId = 2;

const maxRequestDuration = 20000;

const failedChecks = new Counter('failed_checks');

function checkAndFail(response, checks) {
  const result = check(response, checks);
  if (!result) {
    failedChecks.add(1);
    fail('One or more checks failed');
  }
}

export default function () {
  resetPage.resetDB(resetScript);
  // login
  loginPage.login();
  // Upload registration
  registrationsModel.importRegistrations(programId, registrationPV);
  // Duplicate registration to be more then 100k
  resetPage.duplicateRegistrations(duplicateNumber);

  const queryParams = {
    'filter.duplicateStatus': 'duplicate',
  };

  const getRegistration = registrationsModel.getRegistrations(
    programId,
    queryParams,
  );
  console.log('🚀 ~ getRegistration:', getRegistration.timings.duration);

  const getRegistrationBody = JSON.parse(getRegistration.body);
  checkAndFail(getRegistrationBody, {
    'totalItems between 3000 and 10000': (r) =>
      r.meta.totalItems >= 3000 && r.meta.totalItems <= 10000,
  });

  // Check if the request duration is less than 5 seconds
  checkAndFail(getRegistration, {
    'smaller than max request duration': (r) =>
      r.timings.duration < maxRequestDuration,
  });

  sleep(1);
}

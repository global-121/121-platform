import { check, fail, sleep } from 'k6';
import { Counter } from 'k6/metrics';

import { registrationPV } from '../helpers/registration-default.data.js';
import loginModel from '../models/login.js';
import RegistrationsModel from '../models/registrations.js';
import resetModel from '../models/reset.js';

const registrationsModel = new RegistrationsModel();
const resetPage = new resetModel();
const loginPage = new loginModel();

const duplicateNumber = 15; // '17' leads to 131k registrations
const resetScript = 'nlrc-multiple';
const programId = 2;

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

  // export registrations
  const exportRegistrations = registrationsModel.exportRegistrations(
    programId,
    'preferredLanguage',
  );
  checkAndFail(exportRegistrations, {
    'export registrations status is 200': (r) => r.status === 200,
    'export registrations has data': (r) => r.body.length > 0,
  });

  // edit registrations - change preferredLanguage from nl to ar and convert to CSV
  const responseObj = JSON.parse(exportRegistrations.body);
  const registrations = responseObj.data;
  for (const registration of registrations) {
    if (registration.preferredLanguage === 'nl') {
      registration.preferredLanguage = 'ar'; // change to Arabic
    }
  }
  const csvFile = registrationsModel.jsonToCsv(registrations);

  // batch update registrations and check if it takes less than X minutes
  registrationsModel.bulkUpdateRegistrationsCSV(programId, csvFile);
  // TODO: check if the bulk update was successful by the time it takes to process

  // Ask for a guidance where to find the progres of updating registrations

  sleep(1);
}

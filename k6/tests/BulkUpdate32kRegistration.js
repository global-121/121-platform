/* global __ENV */
import { check, fail, sleep } from 'k6';
import { Counter } from 'k6/metrics';

import { registrationPV } from '../helpers/registration-default.data.js';
import loginModel from '../models/login.js';
import RegistrationsModel from '../models/registrations.js';
import resetModel from '../models/reset.js';

const registrationsModel = new RegistrationsModel();
const resetPage = new resetModel();
const loginPage = new loginModel();

const duplicateNumber = parseInt(__ENV.DUPLICATE_NUMBER || '15'); // Default'15' leads to 32k registrations
const resetScript = 'nlrc-multiple';
const programId = 2;
const MAX_BULK_UPDATE_DURATION_MS = 15714; // 15.714 seconds approx. duration for 100k registrations

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
  // Duplicate registration to be 32k
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

  const responseObj = JSON.parse(exportRegistrations.body);
  const registrations = responseObj.data;
  for (const registration of registrations) {
    registration.preferredLanguage = 'ar'; // change to Arabic
  }
  const csvFile = registrationsModel.jsonToCsv(registrations);
  // batch update registrations and check if it takes less than X ms
  const bulkUpdate = registrationsModel.bulkUpdateRegistrationsCSV(
    programId,
    csvFile,
  );
  checkAndFail(bulkUpdate, {
    'bulk update registrations status is 200': (r) => r.status === 200,
    'bulk update time is less than 15714ms': (r) => {
      if (r.timings.duration >= 15714) {
        console.log(`Bulk update time was ${r.timings.duration}ms`);
      }
      return r.timings.duration < MAX_BULK_UPDATE_DURATION_MS;
    },
  });

  sleep(1);
}

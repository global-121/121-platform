/* global __ENV */
import { check, fail, sleep } from 'k6';
import http from 'k6/http';
import { Counter } from 'k6/metrics';

import { registrationPV } from '../helpers/registration-default.data.js';
import config from '../models/config.js';
import loginModel from '../models/login.js';
import RegistrationsModel from '../models/registrations.js';
import resetModel from '../models/reset.js';

const { baseUrl } = config;

const registrationsModel = new RegistrationsModel();
const resetPage = new resetModel();
const loginPage = new loginModel();

const duplicateNumber = parseInt(__ENV.DUPLICATE_NUMBER || '17'); // '17' leads to 131k registrations
const resetScript = 'nlrc-multiple';
const programId = 2;

// At the time of implementation, the request duration was 12s on the server and 3s on the local machine for 130k registrations and about 8k duplicates
const maxRequestDuration = 12000;

export const options = {
  thresholds: {
    http_req_failed: ['rate<0.01'], // http errors should be less than 1%
    failed_checks: ['count<1'], // fail the test if any check fails
  },
  vus: 1,
  duration: '80m',
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

function isServiceUp() {
  const response = http.get(`${baseUrl}api/health/health`);
  return response.status === 200;
}

export default function () {
  // Wait for the service to restart and become available
  let serviceUp = false;
  while (!serviceUp) {
    sleep(1); // wait for 1 second before retrying
    serviceUp = isServiceUp();
  }
  // reset DB
  resetPage.resetDB(resetScript, __filename);
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
  checkAndFail(getRegistration, {
    'totalItems between 3000 and 10000': (r) => {
      const body = JSON.parse(r.body);
      return body.meta.totalItems >= 3000 && body.meta.totalItems <= 10000;
    },
  });

  // Check the request duration
  checkAndFail(getRegistration, {
    'smaller than max request duration': (r) => {
      return r.timings.duration < maxRequestDuration;
    },
  });

  sleep(1);
}

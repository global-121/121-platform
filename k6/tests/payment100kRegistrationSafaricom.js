import { check, sleep } from 'k6';
import { registrationSafaricom } from '../helpers/registration-default.data.js';
import loginModel from '../models/login.js';
import paymentsModel from '../models/payments.js';
import ProgramsModel from '../models/programs.js';
import RegistrationsModel from '../models/registrations.js';
import resetModel from '../models/reset.js';

const paymentsPage = new paymentsModel();
const resetPage = new resetModel();
const loginPage = new loginModel();
const registrationsPage = new RegistrationsModel();
const programsPage = new ProgramsModel();

const duplicateNumber = 17;
const programId = 3;
const paymentId = 3;
const maxTimeoutAttempts = 200;
const minPassRatePercentage = 10;

export const options = {
  thresholds: {
    http_req_failed: ['rate<0.01'], // http errors should be less than 1%
  },
  vus: 1,
  duration: '20m',
  iterations: 1,
};

export default function () {
  // reset db
  const reset = resetPage.resetDB();
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

  // Upload registration
  const registrationImport = registrationsPage.importRegistrations(
    programId,
    registrationSafaricom,
  );
  check(registrationImport, {
    'Import of registration successful status was 201': (r) => r.status == 201,
  });

  // Duplicate registration to be more then 100k
  const duplicateRegistration =
    resetPage.duplicateRegistrations(duplicateNumber);
  check(duplicateRegistration, {
    'Duplication successful status was 201': (r) => r.status == 201,
  });

  // Change status of all PAs to included and check response
  const responseIncluded = programsPage.updateRegistrationStatusAndLog(
    programId,
    'included',
  );
  check(responseIncluded, {
    'Status successfully changed to included: 202': (r) => {
      if (r.status != 202) {
        console.log(r.body);
      }
      return r.status == 202;
    },
  });

  // Do the payment
  const doPayment = paymentsPage.createPayment(programId);
  check(doPayment, {
    'Payment successfully done status 202': (r) => {
      if (r.status != 202) {
        console.log(r.body);
      }
      return r.status == 202;
    },
  });

  // Monitor that 10% of payments is successful and then stop the test
  const monitorPayment = paymentsPage.getPaymentResults(
    programId,
    maxTimeoutAttempts,
    paymentId,
    duplicateNumber,
    minPassRatePercentage,
  );
  check(monitorPayment, {
    'Payment progressed successfully status 200': (r) => {
      if (r.status != 200) {
        const responseBody = JSON.parse(r.body);
        console.log(responseBody.error || r.status);
      }
      return r.status == 200;
    },
  });

  sleep(1);
}

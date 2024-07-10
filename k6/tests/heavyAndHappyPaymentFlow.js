import { check, sleep } from 'k6';
import { registrationVisa } from '../helpers/registration-default.data.js';
import LoginModel from '../models/login.js';
import PaymentsModel from '../models/payments.js';
import ProgramsModel from '../models/programs.js';
import RegistrationsModel from '../models/registrations.js';
import ResetModel from '../models/reset.js';

const resetPage = new ResetModel();
const loginPage = new LoginModel();
const programsPage = new ProgramsModel();
const paymentsPage = new PaymentsModel();
const registrationsPage = new RegistrationsModel();

const duplicateNumber = 15;
const programId = 3;
const paymentId = 3;
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
    'Reset successful status was 202': (r) => r.status == 202,
  });

  // login
  const login = loginPage.login();
  check(login, {
    'Login successful status was 200': (r) => r.status == 201,
    'Login time is less than 200ms': (r) => {
      if (r.timings.duration >= 200) {
        console.log(`Login time was ${r.timings.duration}ms`);
      }
      return r.timings.duration < 200;
    },
  });

  // add 50 program questions to generate a bigger load
  // for (let i = 1; i <= 50; i++) {
  //   const questionName = `question${i}`;
  //   const programQuestions = programsPage.createProgramQuestion(
  //     programId,
  //     questionName,
  //   );
  //   registrationVisa[questionName] = 'bla';

  //   check(programQuestions, {
  //     'Program questions added successfully status was 201': (r) => {
  //       if (r.status != 201) {
  //         console.log(r.body);
  //       }
  //       return r.status == 201;
  //     },
  //   });
  // }

  // // add 15 custom attributes to generate bigger load
  // for (let i = 1; i <= 15; i++) {
  //   const cutstomAttributeName = `nameAttribute${i}`;
  //   const customAttributes = programsPage.updateCustomAttributes(
  //     programId,
  //     cutstomAttributeName,
  //   );
  //   registrationVisa[cutstomAttributeName] = 'bla';

  //   check(customAttributes, {
  //     'Custom attribute added successful status was 201': (r) =>
  //       r.status == 201,
  //   });
  // }

  // Upload registration
  const registrationImport = registrationsPage.importRegistrations(
    programId,
    registrationVisa,
  );
  check(registrationImport, {
    'Import of registration successful status was 201': (r) => r.status == 201,
  });

  // Duplicate registrations between 20k - 50k
  const duplicateRegistration =
    resetPage.duplicateRegistrations(duplicateNumber);
  check(duplicateRegistration, {
    'Duplication successful status was 201': (r) => r.status == 201,
  });

  // get program by id and validate load time is less than 200ms
  const program = programsPage.getProgrammeById(programId);
  check(program, {
    'Programme loaded successfully status was 200': (r) => r.status == 200,
    'Programme load time is less than 200ms': (r) => {
      if (r.timings.duration >= 200) {
        console.log(`Programme time was ${r.timings.duration}ms`);
      }
      return r.timings.duration < 200;
    },
  });

  // Change status of all PAs to paused and check response
  // const responsePaused = programsPage.updateRegistrationStatusAndLog(
  //   programId,
  //   'paused',
  // );
  // check(responsePaused, {
  //   'Status successfully changed to paused: 202': (r) => {
  //     if (r.status != 202) {
  //       console.log(r.body);
  //     }
  //     return r.status == 202;
  //   },
  // });

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

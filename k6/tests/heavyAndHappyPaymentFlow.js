import { check, sleep } from 'k6';
import loginModel from '../models/login.js';
import paymentsModel from '../models/payments.js';
import programsModel from '../models/programs.js';
import resetModel from '../models/reset.js';

const resetPage = new resetModel();
const loginPage = new loginModel();
const programsPage = new programsModel();
const paymentsPage = new paymentsModel();

const duplicateNumber = 13;
const programId = 3;
const paymentId = 3;
const minPassRatePercentage = 10;

export const options = {
  thresholds: {
    http_req_failed: ['rate<0.01'], // http errors should be less than 1%
  },
  vus: 1,
  duration: '25s',
  iterations: 1,
};

export default function () {
  // reset db to 32k registrations
  const reset = resetPage.resetDBMockRegistrations(duplicateNumber);
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

  // add 50 program questions to generate a bigger load
  for (let i = 1; i <= 50; i++) {
    const programQuestions = programsPage.createProgramQuestion(programId, i);
    check(programQuestions, {
      'Program questions added successfully status was 201': (r) => {
        if (r.status != 201) {
          console.log(r.body);
        }
        return r.status == 201;
      },
    });
  }

  // add 15 custom attributes to generate bigger load
  for (let i = 1; i <= 15; i++) {
    const customAttributes = programsPage.updateCustomeAttributes(programId, i);
    check(customAttributes, {
      'Custom attribute added succesfull status was 201': (r) =>
        r.status == 201,
    });
  }

  // get programme by id and validte load time is less than 200ms
  const program = programsPage.getProgrammeById(programId);
  check(program, {
    'Programme loaded succesfully status was 200': (r) => r.status == 200,
    'Programme load time is less than 200ms': (r) => {
      if (r.timings.duration >= 200) {
        console.log(`Programme time was ${r.timings.duration}ms`);
      }
      return r.timings.duration < 200;
    },
  });

  // Change status of all PAs to paused and check response
  const responsePaused = programsPage.updateRegistrationStatusAndLog(
    programId,
    'paused',
  );
  check(responsePaused, {
    'Status successfully changed to paused: 202': (r) => {
      if (r.status != 202) {
        console.log(r.body);
      }
      return r.status == 202;
    },
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

  // Monitor that 10% of payments is succesfull and then stop the test
  const monitorPayment = paymentsPage.getPaymentResults(
    programId,
    paymentId,
    duplicateNumber,
    minPassRatePercentage,
  );
  check(monitorPayment, {
    'Payment progressed successfully status 200': (r) => {
      if (r.status != 200) {
        console.log(r.body);
      }
      return r.status == 200;
    },
  });

  sleep(1);
}

import { check, sleep } from 'k6';
import loginModel from '../models/login.js';
import programsModel from '../models/programs.js';
import resetModel from '../models/reset.js';

const resetPage = new resetModel();
const loginPage = new loginModel();
const programsPage = new programsModel();

export const options = {
  thresholds: {
    http_req_failed: ['rate<0.01'], // http errors should be less than 1%
  },
  vus: 1,
};

export default function () {
  // reset db to 32k registrations
  const reset = resetPage.resetDBMockRegistrations(10);
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
    const programQuestions = programsPage.createProgramQuestion(3, i);
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
    const customAttributes = programsPage.updateCustomeAttributes(3, i);
    check(customAttributes, {
      'Custom attribute added succesfull status was 201': (r) =>
        r.status == 201,
    });
  }

  // get programme by id and validte load time is less than 200ms
  const programme = programsPage.getProgrammeById(3);
  check(programme, {
    'Programme loaded succesfully status was 200': (r) => r.status == 200,
    'Programme load time is less than 200ms': (r) => {
      if (r.timings.duration >= 200) {
        console.log(`Programme time was ${r.timings.duration}ms`);
      }
      return r.timings.duration < 200;
    },
  });

  // Change status of all PAs to paused and check response
  let responsePaused = programsPage.updateRegistrationStatusAndLog(3, 'paused');
  check(responsePaused, {
    'Status successfully changed to paused: 202': (r) => {
      if (r.status != 202) {
        console.log(r.body);
      }
      return r.status == 202;
    },
  });

  // Change status of all PAs to included and check response
  let responseIncluded = programsPage.updateRegistrationStatusAndLog(
    3,
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

  sleep(1);
}

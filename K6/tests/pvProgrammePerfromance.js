import { sleep, check } from 'k6';
import resetModel from '../models/reset.js';
import loginModel from '../models/login.js';
import programsModel from '../models/programs.js';

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
  // reset db
  const reset = resetPage.resetDB('5');
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

  // add custom attributes to generate bigger load
  for (let i = 1; i <= 10; i++) {
    const customAttributes = programsPage.updateCustomeAttributes(2, i);
    check(customAttributes, {
      'Custom attribute added succesfull status was 201': (r) =>
        r.status == 201,
    });
  }

  // get programme by id and validte load time is less than 200ms
  const programme = programsPage.getProgrammeById(2);
  check(programme, {
    'Programme loaded succesfully status was 200': (r) => r.status == 200,
    'Programme load time is less than 200ms': (r) => {
      if (r.timings.duration >= 200) {
        console.log(`Programme time was ${r.timings.duration}ms`);
      }
      return r.timings.duration < 200;
    },
  });

  sleep(1);
}

import { sleep, check } from 'k6';
import resetModel from '../models/reset.js';

const resetPage = new resetModel();

export const options = {
  thresholds: {
    http_req_failed: ['rate<0.01'], // http errors should be less than 1%
    http_req_duration: ['p(95)<7000'], // 95% of requests should be below 200ms
  },
  vus: 1,
  duration: '10s',
};

export default function () {
  const reset = resetPage.resetDB('2');
  check(reset, {
    'Status was 202': (r) => r.status == 202,
  });
  sleep(1);
}

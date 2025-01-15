import { check } from 'k6';

// const initializePayment = new InitializePaymentModel();

// const duplicateNumber = 17; // '17' leads to 131k registrations
// const resetScript = 'nlrc-multiple';
// const programId = 3;
// const paymentId = 3;
// const maxTimeoutAttempts = 1;
// const minPassRatePercentage = 10;
// const amount = 11.11; // Using an amount with cents. To ensure we handle javascript floating point precision issues

export const options = {
  thresholds: {
    http_req_failed: ['rate<0.001'], // http errors should be less than 1%
  },
  vus: 1,
  duration: '3m',
  iterations: 1,
};

export default function () {
  // Manual check that always fails
  check(null, {
    'Manual failure check': () => false,
  });
  // const monitorPayment = initializePayment.initializePayment(
  //   resetScript,
  //   programId,
  //   registrationVisa,
  //   duplicateNumber,
  //   paymentId,
  //   maxTimeoutAttempts,
  //   minPassRatePercentage,
  //   amount,
  // );
  // check(monitorPayment, {
  //   'Payment progressed successfully status 200': (r) => {
  //     if (r.status != 200) {
  //       const responseBody = JSON.parse(r.body);
  //       console.log(responseBody.error || r.status);
  //     }
  //     return r.status == 200;
  //   },
  // });

  // sleep(1);
}

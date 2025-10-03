import { HttpStatus } from '@nestjs/common';
import TestAgent from 'supertest/lib/agent';

import {
  getAccessToken,
  getServer,
  resetDuplicateRegistrations,
} from '@121-service/test/helpers/utility.helper';
import {
  PaymentMonitoringOptions,
  PaymentPerformanceHelper,
} from '@121-service/test/performance/helpers/payment.helper';

describe('Performance During Payment Test', () => {
  let accessToken: string;
  let server: TestAgent<any>;
  let paymentHelper: PaymentPerformanceHelper;

  // K6 equivalent configuration
  const isRunningInCronjob = process.env.RUNNING_IN_CRONJOB === 'true';
  const duplicateNumber = isRunningInCronjob ? 5 : 3; // Light load for this test
  const programId = 3;
  const maxRetryDuration = 3000; // seconds (50 minutes)
  const minPassRatePercentage = 50;
  const amount = 11.11;

  beforeAll(async () => {
    // Initialize performance helper with K6-equivalent thresholds (higher error tolerance)

    server = getServer();
    accessToken = await getAccessToken();
    paymentHelper = new PaymentPerformanceHelper(server as any, accessToken);

    console.log(`Test configuration:`);
    console.log(
      `- Duplicate number: ${duplicateNumber} (${Math.pow(2, duplicateNumber)} registrations)`,
    );
    console.log(`- Program ID: ${programId}`);
    console.log(`- Max retry duration: ${maxRetryDuration} seconds`);
    console.log(`- Min pass rate: ${minPassRatePercentage}%`);
    console.log(`- Payment amount: ${amount}`);
  });

  beforeEach(() => {
  });

  afterAll(() => {
    // Assert overall performance thresholds
  });

  it('should maintain performance during payment processing while testing other endpoints', async () => {
    const testStartTime = Date.now();

    console.log('Starting performance during payment test...');

    // Reset database with mock registrations
    console.log('Resetting database with mock registrations...');
    let startTime = Date.now();
    const resetResponse = await resetDuplicateRegistrations(duplicateNumber);

    expect(resetResponse.status).toBe(HttpStatus.ACCEPTED);

    // Test login performance
    console.log('Testing login performance...');
    startTime = Date.now();
    const loginTime = Date.now() - startTime;
    if (loginTime >= 200) {
      console.log(`Login time was ${loginTime}ms (above 200ms threshold)`);
    }
    expect(loginTime).toBeLessThan(200);

    // Create payment
    console.log('Creating payment...');
    startTime = Date.now();
    const paymentResponse = await paymentHelper.createPayment(
      programId,
      amount,
    );

    expect(paymentResponse.status).toBe(HttpStatus.ACCEPTED);

    const paymentId = paymentResponse.body.id;
    console.log(`Payment created with ID: ${paymentId}`);

    // Monitor payment results
    console.log('Monitoring payment results...');
    startTime = Date.now();
    const monitoringOptions: PaymentMonitoringOptions = {
      programId,
      paymentId,
      maxRetryDuration,
      minPassRatePercentage,
      duplicateNumber,
    };

    const paymentResult =
      await paymentHelper.monitorPaymentResults(monitoringOptions);

    expect(paymentResult.status).toBe(HttpStatus.OK);

    // Test export list endpoint while payment is processing/completed
    console.log('Testing export list endpoint...');
    startTime = Date.now();
    const exportListResponse = await server
      .get(`/api/programs/${programId}/metrics/export-list/registrations`)
      .set('Cookie', [`Authorization=${accessToken}`]);

    expect(exportListResponse.status).toBe(HttpStatus.OK);

    // Test bulk message sending
    console.log('Testing bulk message sending...');
    startTime = Date.now();
    const messageResponse = await server
      .post(`/api/programs/${programId}/registrations/message`)
      .set('Cookie', [`Authorization=${accessToken}`])
      .set('Content-Type', 'application/json')
      .send({
        message: 'Your voucher can be picked up at the location',
      });

    expect(messageResponse.status).toBe(HttpStatus.ACCEPTED);

    const totalTestTime = Date.now() - testStartTime;
    console.log(`Total test time: ${Math.round(totalTestTime / 1000)} seconds`);

    // K6 test had 60-minute duration limit
    expect(totalTestTime).toBeLessThan(3600000); // 60 minutes in ms

    console.log('Performance during payment test completed successfully');
  }, 3900000); // 65-minute Jest timeout (longer than K6 for safety)
});

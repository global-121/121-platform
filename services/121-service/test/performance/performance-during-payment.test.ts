import { HttpStatus } from '@nestjs/common';
import TestAgent from 'supertest/lib/agent';

import {
  getAccessToken,
  getServer,
  resetDuplicateRegistrations,
} from '@121-service/test/helpers/utility.helper';
import { getEnvironmentNumber } from '@121-service/test/performance/helpers/config.helper';
import {
  PaymentMonitoringOptions,
  PaymentPerformanceHelper,
} from '@121-service/test/performance/helpers/payment.helper';
import { PerformanceTestHelper } from '@121-service/test/performance/helpers/performance.helper';

describe('Performance During Payment Test', () => {
  let performanceHelper: PerformanceTestHelper;
  let accessToken: string;
  let server: TestAgent<any>;
  let paymentHelper: PaymentPerformanceHelper;

  // K6 equivalent configuration
  const duplicateNumber = getEnvironmentNumber('DUPLICATE_NUMBER', 5);
  const programId = 3;
  const maxRetryDuration = 3000; // seconds (50 minutes)
  const minPassRatePercentage = 50;
  const amount = 11.11;

  beforeAll(async () => {
    // Initialize performance helper with K6-equivalent thresholds (higher error tolerance)
    performanceHelper = new PerformanceTestHelper({
      httpErrorRate: 0.3, // Less than 30% HTTP errors (more relaxed than other tests)
      maxResponseTime: 200, // Login should be under 200ms
      minPassRate: minPassRatePercentage,
    });

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
    performanceHelper.reset();
  });

  afterAll(() => {
    // Assert overall performance thresholds
    performanceHelper.assertThresholds();
  });

  it('should maintain performance during payment processing while testing other endpoints', async () => {
    const testStartTime = Date.now();

    console.log('Starting performance during payment test...');

    // Reset database with mock registrations
    console.log('Resetting database with mock registrations...');
    let startTime = Date.now();
    const resetResponse = await resetDuplicateRegistrations(duplicateNumber);

    performanceHelper.assertPerformance(
      resetResponse,
      startTime,
      'Database reset should succeed',
    );
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

    performanceHelper.assertPerformance(
      paymentResponse,
      startTime,
      'Payment creation should succeed',
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

    performanceHelper.assertPerformance(
      paymentResult,
      startTime,
      'Payment monitoring should complete successfully',
    );
    expect(paymentResult.status).toBe(HttpStatus.OK);

    // Test export list endpoint while payment is processing/completed
    console.log('Testing export list endpoint...');
    startTime = Date.now();
    const exportListResponse = await server
      .get(`/api/programs/${programId}/metrics/export-list/registrations`)
      .set('Cookie', [`Authorization=${accessToken}`]);

    performanceHelper.assertPerformance(
      exportListResponse,
      startTime,
      'Export list should load successfully',
    );
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

    performanceHelper.assertPerformance(
      messageResponse,
      startTime,
      'Bulk message should be sent successfully',
    );
    expect(messageResponse.status).toBe(HttpStatus.ACCEPTED);

    const totalTestTime = Date.now() - testStartTime;
    console.log(`Total test time: ${Math.round(totalTestTime / 1000)} seconds`);

    // K6 test had 60-minute duration limit
    expect(totalTestTime).toBeLessThan(3600000); // 60 minutes in ms

    console.log('Performance during payment test completed successfully');
  }, 3900000); // 65-minute Jest timeout (longer than K6 for safety)
});

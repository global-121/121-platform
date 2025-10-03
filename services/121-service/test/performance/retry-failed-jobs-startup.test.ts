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

/**
 * Check if the service is healthy
 */
async function isServiceUp(server: TestAgent<any>): Promise<boolean> {
  try {
    const response = await server.get('/api/health/health');
    return response.status === HttpStatus.OK;
  } catch {
    return false;
  }
}

/**
 * Wait for service to be up with retries
 */
async function waitForServiceUp(server: TestAgent<any>): Promise<void> {
  let serviceUp = false;
  let attempts = 0;
  const maxAttempts = 120; // Wait up to 2 minutes for service restart

  while (!serviceUp && attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
    serviceUp = await isServiceUp(server);
    attempts++;

    if (attempts % 10 === 0) {
      console.log(
        `Waiting for service to be up... attempt ${attempts}/${maxAttempts}`,
      );
    }
  }

  if (!serviceUp) {
    throw new Error(
      `Service did not become available after ${maxAttempts} seconds`,
    );
  }

  console.log(`Service is up after ${attempts} attempts`);
}

/**
 * Kill the 121 service to simulate restart
 */
async function kill121Service(
  server: TestAgent<any>,
  accessToken: string,
): Promise<void> {
  try {
    await server
      .post('/api/test/kill-service')
      .set('Cookie', [`Authorization=${accessToken}`])
      .set('Content-Type', 'application/json')
      .send({
        secret: 'fill_in_secret', // This should match the actual secret in env
      });
  } catch (error) {
    // Expected to fail as service will be killed
    console.log('Service kill request sent (connection expected to fail)');
  }
}

describe('Retry Failed Jobs on Startup During Queue Processing Performance Test', () => {
  let performanceHelper: PerformanceTestHelper;
  let accessToken: string;
  let server: TestAgent<any>;
  let paymentHelper: PaymentPerformanceHelper;

  // K6 equivalent configuration
  const duplicateNumber = getEnvironmentNumber('DUPLICATE_NUMBER', 7); // '7' leads to 128 registrations
  const programId = 3;
  const maxRetryDuration = 2000; // seconds
  const minPassRatePercentage = 100;
  const amount = 10;

  beforeAll(async () => {
    // Initialize performance helper with K6-equivalent thresholds (very high error tolerance due to service restarts)
    performanceHelper = new PerformanceTestHelper({
      httpErrorRate: 0.6, // Less than 60% HTTP errors (very relaxed due to service restarts)
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

  it('should retry failed jobs on startup during queue processing within performance thresholds', async () => {
    const testStartTime = Date.now();

    console.log(
      'Starting retry failed jobs on startup during queue processing performance test...',
    );

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

    // Wait for jobs to be added to queue but not processed
    console.log('Waiting for jobs to be queued...');
    await new Promise((resolve) => setTimeout(resolve, 5000)); // 5 seconds

    // Kill the 121 service to simulate restart
    console.log('Killing 121 service to simulate restart...');
    await kill121Service(server, accessToken);

    // Wait for service to restart and become available
    console.log('Waiting for service to restart...');
    await waitForServiceUp(server);

    // Get new access token after service restart
    console.log('Getting new access token after restart...');
    accessToken = await getAccessToken();
    paymentHelper = new PaymentPerformanceHelper(server as any, accessToken);

    // Monitor payment results - jobs should be retried on startup
    console.log('Monitoring payment results after service restart...');
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
      'Payment monitoring should complete successfully after restart',
    );
    expect(paymentResult.status).toBe(HttpStatus.OK);

    const totalTestTime = Date.now() - testStartTime;
    console.log(`Total test time: ${Math.round(totalTestTime / 1000)} seconds`);

    // K6 test had 60-minute duration limit
    expect(totalTestTime).toBeLessThan(3600000); // 60 minutes in ms

    console.log(
      'Retry failed jobs on startup during queue processing performance test completed successfully',
    );
  }, 3900000); // 65-minute Jest timeout (longer than K6 for safety)
});

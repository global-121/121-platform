import { HttpStatus } from '@nestjs/common';
import TestAgent from 'supertest/lib/agent';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  getAccessToken,
  getServer,
  resetDB,
  resetDuplicateRegistrations,
} from '@121-service/test/helpers/utility.helper';
import { getEnvironmentNumber } from '@121-service/test/performance/helpers/config.helper';
import { PaymentPerformanceHelper } from '@121-service/test/performance/helpers/payment.helper';
import { PerformanceTestHelper } from '@121-service/test/performance/helpers/performance.helper';

// Registration data for PV program (from K6 helpers)
const registrationPV = {
  referenceId: '44e62864557597e0d',
  preferredLanguage: 'nl',
  paymentAmountMultiplier: 1,
  fullName: 'Gemma Houtenbos',
  phoneNumber: '14155235556',
  programFspConfigurationName: 'Intersolve-voucher-whatsapp',
  whatsappPhoneNumber: '14155235555',
};

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
  const maxAttempts = 60; // Wait up to 60 seconds

  while (!serviceUp && attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
    serviceUp = await isServiceUp(server);
    attempts++;
  }

  if (!serviceUp) {
    throw new Error('Service did not become available after 60 seconds');
  }
}

describe('Find Duplicates 100k+ Registrations Performance Test', () => {
  let performanceHelper: PerformanceTestHelper;
  let accessToken: string;
  let server: TestAgent<any>;
  let paymentHelper: PaymentPerformanceHelper;

  // K6 equivalent configuration
  const duplicateNumber = getEnvironmentNumber('DUPLICATE_NUMBER', 17); // '17' leads to 131k registrations
  const resetScript = SeedScript.nlrcMultiple;
  const programId = 2;

  // At the time of implementation, the request duration was 12s on the server and 3s on the local machine
  // for 130k registrations and about 8k duplicates
  const maxRequestDuration = 12000; // 12 seconds

  beforeAll(async () => {
    // Initialize performance helper with K6-equivalent thresholds
    performanceHelper = new PerformanceTestHelper({
      httpErrorRate: 0.01, // Less than 1% HTTP errors
      maxResponseTime: maxRequestDuration,
    });

    server = getServer();
    accessToken = await getAccessToken();
    paymentHelper = new PaymentPerformanceHelper(server as any, accessToken);

    console.log(`Test configuration:`);
    console.log(
      `- Duplicate number: ${duplicateNumber} (${Math.pow(2, duplicateNumber)} registrations)`,
    );
    console.log(`- Program ID: ${programId}`);
    console.log(`- Max request duration: ${maxRequestDuration}ms`);
  });

  beforeEach(() => {
    performanceHelper.reset();
  });

  afterAll(() => {
    // Assert overall performance thresholds
    performanceHelper.assertThresholds();
  });

  it('should find duplicates in 100k+ registrations within performance thresholds', async () => {
    const testStartTime = Date.now();

    console.log(
      'Starting find duplicates 100k+ registrations performance test...',
    );

    // Wait for service to be up (like K6 health check)
    console.log('Checking service health...');
    await waitForServiceUp(server);
    console.log('Service is healthy');

    // Reset database
    console.log('Resetting database...');
    let startTime = Date.now();
    const resetResponse = await resetDB(
      resetScript,
      'findDuplicates100kRegistrations.test.ts',
    );

    performanceHelper.assertPerformance(
      resetResponse,
      startTime,
      'Database reset should succeed',
    );
    expect(resetResponse.status).toBe(HttpStatus.ACCEPTED);

    // Import initial registration
    console.log('Importing initial registration...');
    startTime = Date.now();
    const importResponse = await paymentHelper.importRegistration(
      programId,
      registrationPV,
    );

    performanceHelper.assertPerformance(
      importResponse,
      startTime,
      'Registration import should succeed',
    );
    expect(importResponse.status).toBe(HttpStatus.CREATED);

    // Create duplicate registrations to reach 131k
    console.log(
      `Creating ${Math.pow(2, duplicateNumber)} duplicate registrations...`,
    );
    startTime = Date.now();
    const duplicateResponse =
      await resetDuplicateRegistrations(duplicateNumber);

    performanceHelper.assertPerformance(
      duplicateResponse,
      startTime,
      'Duplicate creation should succeed',
    );
    expect(duplicateResponse.status).toBe(HttpStatus.ACCEPTED);

    // Query for duplicates and measure performance
    console.log('Querying for duplicate registrations...');
    startTime = Date.now();

    const duplicatesResponse = await server
      .get(`/api/programs/${programId}/registrations`)
      .query({
        'filter.duplicateStatus': 'duplicate',
      })
      .set('Cookie', [`Authorization=${accessToken}`]);

    const queryDuration = Date.now() - startTime;

    performanceHelper.assertPerformance(
      duplicatesResponse,
      startTime,
      'Duplicates query should succeed',
    );

    expect(duplicatesResponse.status).toBe(HttpStatus.OK);

    // Validate duplicate count (K6 expected 3000-10000 duplicates)
    const responseBody = duplicatesResponse.body;
    expect(responseBody.meta).toBeDefined();
    expect(responseBody.meta.totalItems).toBeGreaterThanOrEqual(3000);
    expect(responseBody.meta.totalItems).toBeLessThanOrEqual(10000);

    console.log(
      `Found ${responseBody.meta.totalItems} duplicate registrations`,
    );

    // Check query performance (like K6 timing check)
    if (queryDuration >= maxRequestDuration) {
      console.log(
        `Query time was ${queryDuration}ms (above ${maxRequestDuration}ms threshold)`,
      );
    }
    expect(queryDuration).toBeLessThan(maxRequestDuration);

    const totalTestTime = Date.now() - testStartTime;
    console.log(`Total test time: ${Math.round(totalTestTime / 1000)} seconds`);
    console.log(`Duplicates query completed in: ${queryDuration}ms`);

    // K6 test had 80-minute duration limit
    expect(totalTestTime).toBeLessThan(4800000); // 80 minutes in ms

    console.log(
      'Find duplicates 100k+ registrations performance test completed successfully',
    );
  }, 5400000); // 90-minute Jest timeout (longer than K6 for safety)
});

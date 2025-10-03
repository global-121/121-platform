import { HttpStatus } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import TestAgent from 'supertest/lib/agent';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  getAccessToken,
  getServer,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { PerformanceTestHelper } from '@121-service/test/performance/helpers/performance.helper';

describe('Import 1000 Registrations Performance Test', () => {
  let accessToken: string;
  let server: TestAgent<any>;
  let performanceHelper: PerformanceTestHelper;

  const resetScript = SeedScript.testMultiple;
  const programId = 2;
  const csvFilePath = join(
    __dirname,
    '../../../e2e/test-registration-data/test-registrations-westeros-1000.csv',
  );

  beforeAll(async () => {
    // Initialize performance helper with K6-equivalent thresholds
    performanceHelper = new PerformanceTestHelper({
      httpErrorRate: 0.01, // Less than 1% HTTP errors
      maxResponseTime: 200, // Login should be under 200ms
    });

    server = getServer();

    // Check if CSV file exists
    try {
      readFileSync(csvFilePath);
    } catch (error) {
      throw new Error(`CSV file not found: ${csvFilePath}`);
    }
  });

  beforeEach(() => {
    performanceHelper.reset();
  });

  afterAll(() => {
    // Assert overall performance thresholds
    performanceHelper.assertThresholds();
  });

  it('should import 1000 registrations within performance thresholds', async () => {
    const testStartTime = Date.now();

    // Reset database
    console.log('Resetting database...');
    let startTime = Date.now();
    const resetResponse = await resetDB(
      resetScript,
      'import1000Registrations.test.ts',
    );

    performanceHelper.assertPerformance(
      resetResponse,
      startTime,
      'Database reset should succeed',
    );
    expect(resetResponse.status).toBe(HttpStatus.ACCEPTED);

    // Login
    console.log('Logging in...');
    startTime = Date.now();
    accessToken = await getAccessToken();

    // Test login performance (replicating K6 login time check)
    const loginTime = Date.now() - startTime;
    if (loginTime >= 200) {
      console.log(`Login time was ${loginTime}ms (above 200ms threshold)`);
    }
    expect(loginTime).toBeLessThan(200);
    expect(accessToken).toBeDefined();

    // Import registrations from CSV
    console.log('Importing 1000 registrations...');
    startTime = Date.now();

    const csvBuffer = readFileSync(csvFilePath);
    const importResponse = await server
      .post(`/api/programs/${programId}/registrations/import`)
      .set('Cookie', [`Authorization=${accessToken}`])
      .attach('file', csvBuffer, 'registrations.csv')
      .timeout(1200000); // 20 minutes timeout like K6

    performanceHelper.assertPerformance(
      importResponse,
      startTime,
      'Registration import should succeed',
    );

    expect(importResponse.status).toBe(HttpStatus.CREATED);

    const totalTestTime = Date.now() - testStartTime;
    console.log(`Total test time: ${totalTestTime}ms`);

    // K6 test had 9-minute duration limit
    expect(totalTestTime).toBeLessThan(540000); // 9 minutes in ms
  }, 600000); // 10-minute Jest timeout
});

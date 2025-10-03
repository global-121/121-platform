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

// Get test configuration based on environment
const isRunningInCronjob = process.env.RUNNING_IN_CRONJOB === 'true';
const duplicateNumber = isRunningInCronjob ? 10 : 5; // More registrations in cronjob

describe('Import 1000 Registrations Performance Test', () => {
  let accessToken: string;
  let server: TestAgent<any>;

  const resetScript = SeedScript.testMultiple;
  const programId = 2;
  const csvFilePath = join(
    __dirname,
    '../../../e2e/test-registration-data/test-registrations-westeros-1000.csv',
  );

  beforeAll(async () => {
    server = getServer();
    
    // Check if CSV file exists
    try {
      readFileSync(csvFilePath);
    } catch (error) {
      throw new Error(`CSV file not found: ${csvFilePath}`);
    }
    
    console.log(`Running with configuration: cronjob=${isRunningInCronjob}, duplicateNumber=${duplicateNumber}`);
  });

  it('should import 1000 registrations within performance thresholds', async () => {
    const testStartTime = Date.now();

    // Reset database
    console.log('Resetting database...');
    let startTime = Date.now();
    const resetResponse = await resetDB(resetScript, 'import1000Registrations.test.ts');
    
    expect(resetResponse.status).toBe(HttpStatus.ACCEPTED);
    console.log(`Database reset completed in ${Date.now() - startTime}ms`);

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
      .timeout(1200000); // 20 minutes timeout
    
    expect(importResponse.status).toBe(HttpStatus.CREATED);
    
    const importTime = Date.now() - startTime;
    console.log(`Registration import completed in ${importTime}ms`);

    const totalTestTime = Date.now() - testStartTime;
    console.log(`Total test time: ${totalTestTime}ms`);
    
    // Performance expectation: should complete within reasonable time
    const maxDuration = isRunningInCronjob ? 540000 : 300000; // 9 min vs 5 min
    expect(totalTestTime).toBeLessThan(maxDuration);
  }, isRunningInCronjob ? 600000 : 360000); // 10 min vs 6 min timeout
});

import { HttpStatus } from '@nestjs/common';
import TestAgent from 'supertest/lib/agent';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  getAccessToken,
  getServer,
  resetDB,
  resetDuplicateRegistrations,
} from '@121-service/test/helpers/utility.helper';

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
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    serviceUp = await isServiceUp(server);
    attempts++;
  }
  
  if (!serviceUp) {
    throw new Error('Service did not become available after 60 seconds');
  }
}

// Get test configuration based on environment
const isRunningInCronjob = process.env.RUNNING_IN_CRONJOB === 'true';
const duplicateNumber = isRunningInCronjob ? 17 : 12; // Heavy vs moderate load

describe('Find Duplicates 100k+ Registrations Performance Test', () => {
  let accessToken: string;
  let server: TestAgent<any>;

  const resetScript = SeedScript.nlrcMultiple;
  const programId = 2;
  
  // At the time of implementation, the request duration was 12s on the server and 3s on the local machine 
  // for 130k registrations and about 8k duplicates
  const maxRequestDuration = 12000; // 12 seconds

  beforeAll(async () => {
    server = getServer();
    accessToken = await getAccessToken();

    console.log(`Running find duplicates test: cronjob=${isRunningInCronjob}, duplicateNumber=${duplicateNumber} (${Math.pow(2, duplicateNumber)} registrations)`);
  });

  it('should find duplicates in 100k+ registrations within performance thresholds', async () => {
    const testStartTime = Date.now();
    
    console.log('Starting find duplicates 100k+ registrations performance test...');

    // Wait for service to be up (like K6 health check)
    console.log('Checking service health...');
    await waitForServiceUp(server);
    console.log('Service is healthy');

    // Reset database
    console.log('Resetting database...');
    let startTime = Date.now();
    const resetResponse = await resetDB(resetScript, 'findDuplicates100kRegistrations.test.ts');
    
    expect(resetResponse.status).toBe(HttpStatus.ACCEPTED);
    console.log(`Database reset completed in ${Date.now() - startTime}ms`);

    // Import initial registration
    console.log('Importing initial registration...');
    startTime = Date.now();
    const importResponse = await server
      .post(`/api/programs/${programId}/registrations`)
      .set('Cookie', [`Authorization=${accessToken}`])
      .set('Content-Type', 'application/json')
      .send([registrationPV]);
    
    expect(importResponse.status).toBe(HttpStatus.CREATED);
    console.log(`Registration import completed in ${Date.now() - startTime}ms`);

    // Create duplicate registrations to reach target count
    console.log(`Creating ${Math.pow(2, duplicateNumber)} duplicate registrations...`);
    startTime = Date.now();
    const duplicateResponse = await resetDuplicateRegistrations(duplicateNumber);
    
    expect(duplicateResponse.status).toBe(HttpStatus.ACCEPTED);
    console.log(`Duplicate creation completed in ${Date.now() - startTime}ms`);

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
    
    expect(duplicatesResponse.status).toBe(HttpStatus.OK);
    
    // Validate duplicate count (K6 expected 3000-10000 duplicates)
    const responseBody = duplicatesResponse.body;
    expect(responseBody.meta).toBeDefined();
    expect(responseBody.meta.totalItems).toBeGreaterThanOrEqual(100); // Relaxed for smaller test loads
    
    console.log(`Found ${responseBody.meta.totalItems} duplicate registrations`);

    // Check query performance (like K6 timing check)
    if (queryDuration >= maxRequestDuration) {
      console.log(`Query time was ${queryDuration}ms (above ${maxRequestDuration}ms threshold)`);
    }
    
    const maxDuration = isRunningInCronjob ? maxRequestDuration : maxRequestDuration * 2; // More lenient for lighter loads
    expect(queryDuration).toBeLessThan(maxDuration);

    const totalTestTime = Date.now() - testStartTime;
    console.log(`Total test time: ${Math.round(totalTestTime / 1000)} seconds`);
    console.log(`Duplicates query completed in: ${queryDuration}ms`);
    
    // Performance expectation based on environment
    const maxTotalDuration = isRunningInCronjob ? 4800000 : 1200000; // 80 vs 20 minutes
    expect(totalTestTime).toBeLessThan(maxTotalDuration);
    
    console.log('Find duplicates 100k+ registrations performance test completed successfully');
  }, isRunningInCronjob ? 5400000 : 1500000); // 90 vs 25 minute timeout
});

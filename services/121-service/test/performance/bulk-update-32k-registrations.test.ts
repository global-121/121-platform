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
 * Convert JSON data to CSV format (migrated from K6 jsonToCsv)
 */
function jsonToCsv(data: Record<string, any>[]): string {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  for (const item of data) {
    const row = headers.map((header) => {
      const value = item[header];
      return `"${String(value).replace(/"/g, '""')}"`;
    });
    csvRows.push(row.join(','));
  }
  
  return csvRows.join('\n');
}

// Get test configuration based on environment
const isRunningInCronjob = process.env.RUNNING_IN_CRONJOB === 'true';
const duplicateNumber = isRunningInCronjob ? 15 : 10; // Moderate load: 32k vs 1k registrations

describe('Bulk Update 32k Registrations Performance Test', () => {
  let accessToken: string;
  let server: TestAgent<any>;

  const resetScript = SeedScript.nlrcMultiple;
  const programId = 2;
  const MAX_BULK_UPDATE_DURATION_MS = 15714; // 15.714 seconds approx. duration for 100k registrations

  beforeAll(async () => {
    server = getServer();
    accessToken = await getAccessToken();

    console.log(`Running bulk update test: cronjob=${isRunningInCronjob}, duplicateNumber=${duplicateNumber} (${Math.pow(2, duplicateNumber)} registrations)`);
  });

  it('should bulk update 32k registrations within performance thresholds', async () => {
    const testStartTime = Date.now();
    
    console.log('Starting bulk update 32k registrations performance test...');

    // Reset database
    console.log('Resetting database...');
    let startTime = Date.now();
    const resetResponse = await resetDB(resetScript, 'BulkUpdate32kRegistration.test.ts');
    
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

    // Export registrations to get current data
    console.log('Exporting registrations...');
    startTime = Date.now();
    const exportResponse = await server
      .get(`/api/programs/${programId}/metrics/export-list/registrations`)
      .query({
        sortBy: 'registrationProgramId:DESC',
        select: 'referenceId,preferredLanguage',
        format: 'json',
      })
      .set('Cookie', [`Authorization=${accessToken}`]);
    
    expect(exportResponse.status).toBe(HttpStatus.OK);
    expect(exportResponse.body.data).toBeDefined();
    expect(exportResponse.body.data.length).toBeGreaterThan(0);
    console.log(`Export completed in ${Date.now() - startTime}ms`);

    // Modify the data (change language to Arabic)
    const registrations = exportResponse.body.data;
    console.log(`Modifying ${registrations.length} registrations...`);
    
    for (const registration of registrations) {
      registration.preferredLanguage = 'ar'; // change to Arabic
    }

    // Convert to CSV
    const csvContent = jsonToCsv(registrations);
    expect(csvContent).toBeDefined();
    expect(csvContent.length).toBeGreaterThan(0);

    // Perform bulk update and measure performance
    console.log('Performing bulk update...');
    startTime = Date.now();
    
    const bulkUpdateResponse = await server
      .patch(`/api/programs/${programId}/registrations`)
      .set('Cookie', [`Authorization=${accessToken}`])
      .field('reason', 'bulk update')
      .attach('file', Buffer.from(csvContent), 'registrations.csv');

    const bulkUpdateDuration = Date.now() - startTime;
    
    expect(bulkUpdateResponse.status).toBe(HttpStatus.OK);
    
    // Check bulk update performance (like K6 timing check)
    if (bulkUpdateDuration >= MAX_BULK_UPDATE_DURATION_MS) {
      console.log(`Bulk update time was ${bulkUpdateDuration}ms (above ${MAX_BULK_UPDATE_DURATION_MS}ms threshold)`);
    }
    
    const maxDuration = isRunningInCronjob ? MAX_BULK_UPDATE_DURATION_MS : MAX_BULK_UPDATE_DURATION_MS * 2; // More lenient for lighter loads
    expect(bulkUpdateDuration).toBeLessThan(maxDuration);

    const totalTestTime = Date.now() - testStartTime;
    console.log(`Total test time: ${Math.round(totalTestTime / 1000)} seconds`);
    console.log(`Bulk update completed in: ${bulkUpdateDuration}ms`);
    
    console.log('Bulk update 32k registrations performance test completed successfully');
  }, isRunningInCronjob ? 600000 : 360000); // 10 vs 6 minute timeout
});

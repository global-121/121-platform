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

describe('Bulk Update 32k Registrations Performance Test', () => {
  let performanceHelper: PerformanceTestHelper;
  let accessToken: string;
  let server: TestAgent<any>;
  let paymentHelper: PaymentPerformanceHelper;

  // K6 equivalent configuration
  const duplicateNumber = getEnvironmentNumber('DUPLICATE_NUMBER', 15); // Default '15' leads to 32k registrations
  const resetScript = SeedScript.nlrcMultiple;
  const programId = 2;
  const MAX_BULK_UPDATE_DURATION_MS = 15714; // 15.714 seconds approx. duration for 100k registrations

  beforeAll(async () => {
    // Initialize performance helper with K6-equivalent thresholds
    performanceHelper = new PerformanceTestHelper({
      httpErrorRate: 0.01, // Less than 1% HTTP errors
      maxResponseTime: MAX_BULK_UPDATE_DURATION_MS,
    });

    server = getServer();
    accessToken = await getAccessToken();
    paymentHelper = new PaymentPerformanceHelper(server as any, accessToken);

    console.log(`Test configuration:`);
    console.log(
      `- Duplicate number: ${duplicateNumber} (${Math.pow(2, duplicateNumber)} registrations)`,
    );
    console.log(`- Program ID: ${programId}`);
    console.log(`- Max bulk update duration: ${MAX_BULK_UPDATE_DURATION_MS}ms`);
  });

  beforeEach(() => {
    performanceHelper.reset();
  });

  afterAll(() => {
    // Assert overall performance thresholds
    performanceHelper.assertThresholds();
  });

  it('should bulk update 32k registrations within performance thresholds', async () => {
    const testStartTime = Date.now();

    console.log('Starting bulk update 32k registrations performance test...');

    // Reset database
    console.log('Resetting database...');
    let startTime = Date.now();
    const resetResponse = await resetDB(
      resetScript,
      'BulkUpdate32kRegistration.test.ts',
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

    // Create duplicate registrations to reach 32k
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

    performanceHelper.assertPerformance(
      exportResponse,
      startTime,
      'Export registrations should succeed',
    );
    expect(exportResponse.status).toBe(HttpStatus.OK);
    expect(exportResponse.body.data).toBeDefined();
    expect(exportResponse.body.data.length).toBeGreaterThan(0);

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

    performanceHelper.assertPerformance(
      bulkUpdateResponse,
      startTime,
      'Bulk update should succeed',
    );

    expect(bulkUpdateResponse.status).toBe(HttpStatus.OK);

    // Check bulk update performance (like K6 timing check)
    if (bulkUpdateDuration >= MAX_BULK_UPDATE_DURATION_MS) {
      console.log(
        `Bulk update time was ${bulkUpdateDuration}ms (above ${MAX_BULK_UPDATE_DURATION_MS}ms threshold)`,
      );
    }
    expect(bulkUpdateDuration).toBeLessThan(MAX_BULK_UPDATE_DURATION_MS);

    const totalTestTime = Date.now() - testStartTime;
    console.log(`Total test time: ${Math.round(totalTestTime / 1000)} seconds`);
    console.log(`Bulk update completed in: ${bulkUpdateDuration}ms`);

    console.log(
      'Bulk update 32k registrations performance test completed successfully',
    );
  }, 600000); // 10-minute Jest timeout
});

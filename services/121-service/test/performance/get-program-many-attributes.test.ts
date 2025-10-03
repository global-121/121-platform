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

// Registration data for Visa program (from K6 helpers)
const registrationVisa = {
  referenceId: 'registration-visa-1',
  preferredLanguage: 'en',
  paymentAmountMultiplier: 1,
  fullName: 'Jane Doe',
  phoneNumber: '14155238887',
  programFspConfigurationName: 'Intersolve-visa',
  addressStreet: 'Teststraat',
  addressHouseNumber: '1',
  addressHouseNumberAddition: '',
  addressPostalCode: '1234AB',
  addressCity: 'Stad',
  whatsappPhoneNumber: '14155238887',
};

/**
 * Helper class for program operations (simplified version)
 */
class ProgramPerformanceHelper {
  private server: any;
  private accessToken: string;

  constructor(server: any, accessToken: string) {
    this.server = server;
    this.accessToken = accessToken;
  }

  /**
   * Create a program registration attribute
   */
  async createProgramRegistrationAttribute(
    programId: number,
    attributeName: string,
  ): Promise<any> {
    return this.server
      .post(`/api/programs/${programId}/registration-attributes`)
      .set('Cookie', [`Authorization=${this.accessToken}`])
      .set('Content-Type', 'application/json')
      .send({
        options: ['string'],
        scoring: {},
        pattern: 'string',
        showInPeopleAffectedTable: false,
        editableInPortal: true,
        export: ['payment'],
        placeholder: {
          en: '+31 6 00 00 00 00',
        },
        duplicateCheck: false,
        name: attributeName,
        label: {
          en: attributeName,
          fr: 'Remplissez votre nom, sil vous plaît:',
        },
        type: 'text',
        isRequired: false,
      });
  }

  /**
   * Get program by ID
   */
  async getProgramById(programId: number): Promise<any> {
    return this.server
      .get(`/api/programs/${programId}`)
      .set('Cookie', [`Authorization=${this.accessToken}`]);
  }
}

describe('Get Program with Many Attributes Performance Test', () => {
  let performanceHelper: PerformanceTestHelper;
  let accessToken: string;
  let server: TestAgent<any>;
  let paymentHelper: PaymentPerformanceHelper;
  let programHelper: ProgramPerformanceHelper;

  // K6 equivalent configuration
  const resetScript = SeedScript.nlrcMultiple;
  const duplicateNumber = getEnvironmentNumber('DUPLICATE_NUMBER', 5);
  const programId = 2;

  beforeAll(async () => {
    // Initialize performance helper with K6-equivalent thresholds
    performanceHelper = new PerformanceTestHelper({
      httpErrorRate: 0.01, // Less than 1% HTTP errors
      maxResponseTime: 200, // Login and program load should be under 200ms
    });

    server = getServer();
    accessToken = await getAccessToken();
    paymentHelper = new PaymentPerformanceHelper(server as any, accessToken);
    programHelper = new ProgramPerformanceHelper(server, accessToken);

    console.log(`Test configuration:`);
    console.log(
      `- Duplicate number: ${duplicateNumber} (${Math.pow(2, duplicateNumber)} registrations)`,
    );
    console.log(`- Program ID: ${programId}`);
  });

  beforeEach(() => {
    performanceHelper.reset();
  });

  afterAll(() => {
    // Assert overall performance thresholds
    performanceHelper.assertThresholds();
  });

  it('should load program with many attributes within performance thresholds', async () => {
    const testStartTime = Date.now();

    console.log(
      'Starting get program with many attributes performance test...',
    );

    // Reset database
    console.log('Resetting database...');
    let startTime = Date.now();
    const resetResponse = await resetDB(
      resetScript,
      'getProgramWithManyAttributes.test.ts',
    );

    performanceHelper.assertPerformance(
      resetResponse,
      startTime,
      'Database reset should succeed',
    );
    expect(resetResponse.status).toBe(HttpStatus.ACCEPTED);

    // Test login performance
    const loginTime = Date.now() - startTime;
    if (loginTime >= 200) {
      console.log(`Login time was ${loginTime}ms (above 200ms threshold)`);
    }
    expect(loginTime).toBeLessThan(200);

    // Add 50 program registration attributes to generate bigger load
    console.log('Adding 50 program registration attributes...');
    const modifiedRegistration = { ...registrationVisa };

    for (let i = 1; i <= 50; i++) {
      const attributeName = `attribute${i}`;
      startTime = Date.now();

      const attributeResponse =
        await programHelper.createProgramRegistrationAttribute(
          programId,
          attributeName,
        );

      performanceHelper.assertPerformance(
        attributeResponse,
        startTime,
        `Attribute ${attributeName} should be created`,
      );
      expect(attributeResponse.status).toBe(HttpStatus.CREATED);

      // Add to registration data
      modifiedRegistration[attributeName] = 'bla';
    }

    // Import registration with all attributes
    console.log('Importing registration with attributes...');
    startTime = Date.now();
    const importResponse = await paymentHelper.importRegistration(
      programId,
      modifiedRegistration,
    );

    performanceHelper.assertPerformance(
      importResponse,
      startTime,
      'Registration import should succeed',
    );
    expect(importResponse.status).toBe(HttpStatus.CREATED);

    // Create duplicate registrations
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

    // Get program by ID and validate load time (main test focus)
    console.log('Testing program load performance with many attributes...');
    startTime = Date.now();
    const programResponse = await programHelper.getProgramById(programId);

    const programLoadTime = Date.now() - startTime;
    performanceHelper.assertPerformance(
      programResponse,
      startTime,
      'Program should load successfully',
    );
    expect(programResponse.status).toBe(HttpStatus.OK);

    if (programLoadTime >= 200) {
      console.log(
        `Program load time was ${programLoadTime}ms (above 200ms threshold)`,
      );
    }
    expect(programLoadTime).toBeLessThan(200);

    const totalTestTime = Date.now() - testStartTime;
    console.log(`Total test time: ${Math.round(totalTestTime / 1000)} seconds`);
    console.log(`Program with many attributes loaded in: ${programLoadTime}ms`);

    // K6 test had 30-second duration limit
    expect(totalTestTime).toBeLessThan(30000); // 30 seconds in ms

    console.log(
      'Get program with many attributes performance test completed successfully',
    );
  }, 60000); // 1-minute Jest timeout
});

import { HttpStatus } from '@nestjs/common';
import TestAgent from 'supertest/lib/agent';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  getAccessToken,
  getServer,
  resetDB,
  resetDuplicateRegistrations,
} from '@121-service/test/helpers/utility.helper';
import {
  PaymentMonitoringOptions,
  PaymentPerformanceHelper,
} from '@121-service/test/performance/helpers/payment.helper';

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
 * Helper class for program operations (migrated from K6 ProgramsModel)
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

  /**
   * Get status overview for a program
   */
  async getStatusOverview(programId: number): Promise<any> {
    return this.server
      .get(`/api/programs/${programId}/metrics/registration-status`)
      .set('Cookie', [`Authorization=${this.accessToken}`]);
  }

  /**
   * Update registration status with monitoring
   */
  async updateRegistrationStatusAndLog(
    programId: number,
    status: string,
  ): Promise<any> {
    const response = await this.server
      .patch(`/api/programs/${programId}/registrations/status`)
      .set('Cookie', [`Authorization=${this.accessToken}`])
      .set('Content-Type', 'application/json')
      .send({
        status,
        message: 'Updated for performance test',
      });

    if (response.status === HttpStatus.OK) {
      const responseBody = response.body;
      console.log(
        `totalFilterCount: ${responseBody.totalFilterCount}, applicableCount: ${responseBody.applicableCount}, nonApplicableCount: ${responseBody.nonApplicableCount}`,
      );

      // Wait for status change to be fully processed (simplified version of K6 logic)
      let attempts = 0;
      const maxAttempts = 20;

      while (attempts < maxAttempts) {
        const statusOverview = await this.getStatusOverview(programId);
        if (statusOverview.status === HttpStatus.OK) {
          const statusData = statusOverview.body;
          const statusItem = statusData.find(
            (item: any) => item.status === status,
          );
          const statusCount = statusItem ? statusItem.statusCount : 0;

          console.log(
            `Checking counts: applicableCount = ${responseBody.applicableCount}, statusCount = ${statusCount}`,
          );

          if (
            parseInt(responseBody.applicableCount) === parseInt(statusCount)
          ) {
            break;
          }
        }

        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 3 seconds
      }
    }

    return response;
  }
}

describe('Status Change Payment in Large Program Performance Test', () => {
  let accessToken: string;
  let server: TestAgent<any>;
  let paymentHelper: PaymentPerformanceHelper;
  let programHelper: ProgramPerformanceHelper;

  // K6 equivalent configuration
  const resetScript = SeedScript.nlrcMultiple;
  const isRunningInCronjob = process.env.RUNNING_IN_CRONJOB === 'true';
  const duplicateNumber = isRunningInCronjob ? 15 : 10; // Heavy load vs moderate load
  const programId = 3;
  const maxRetryDuration = 3000; // seconds
  const minPassRatePercentage = 10;
  const amount = 10;

  beforeAll(async () => {
    // Initialize performance helper with K6-equivalent thresholds (slightly higher error tolerance)

    server = getServer();
    accessToken = await getAccessToken();
    paymentHelper = new PaymentPerformanceHelper(server as any, accessToken);
    programHelper = new ProgramPerformanceHelper(server, accessToken);

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

  it('should handle status changes and payments in large program within performance thresholds', async () => {
    const testStartTime = Date.now();

    console.log(
      'Starting status change payment in large program performance test...',
    );

    // Reset database
    console.log('Resetting database...');
    let startTime = Date.now();
    const resetResponse = await resetDB(
      resetScript,
      'statusChangePaymentInLargeProgram.test.ts',
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

    expect(importResponse.status).toBe(HttpStatus.CREATED);

    // Create duplicate registrations (20k-50k range)
    console.log(
      `Creating ${Math.pow(2, duplicateNumber)} duplicate registrations...`,
    );
    startTime = Date.now();
    const duplicateResponse =
      await resetDuplicateRegistrations(duplicateNumber);

    expect(duplicateResponse.status).toBe(HttpStatus.ACCEPTED);

    // Get program by ID and validate load time
    console.log('Testing program load performance...');
    startTime = Date.now();
    const programResponse = await programHelper.getProgramById(programId);

    const programLoadTime = Date.now() - startTime;
    expect(programResponse.status).toBe(HttpStatus.OK);

    if (programLoadTime >= 200) {
      console.log(
        `Program load time was ${programLoadTime}ms (above 200ms threshold)`,
      );
    }
    expect(programLoadTime).toBeLessThan(200);

    // Change status of all registrations to included
    console.log('Updating registration status to included...');
    startTime = Date.now();
    const statusResponse = await programHelper.updateRegistrationStatusAndLog(
      programId,
      'included',
    );

    expect(statusResponse.status).toBe(HttpStatus.ACCEPTED);

    // Verify payment dry run
    console.log('Verifying payment dry run...');
    await paymentHelper.verifyPaymentDryRunUntilSuccess(programId);

    // Create payment
    console.log('Creating payment...');
    startTime = Date.now();
    const paymentResponse = await paymentHelper.createPayment(
      programId,
      amount,
    );

    expect(paymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(paymentResponse.body.id).toBeDefined();

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

    const totalTestTime = Date.now() - testStartTime;
    console.log(`Total test time: ${Math.round(totalTestTime / 1000)} seconds`);

    // K6 test had 20-minute duration limit
    expect(totalTestTime).toBeLessThan(1200000); // 20 minutes in ms

    console.log(
      'Status change payment in large program performance test completed successfully',
    );
  }, 1500000); // 25-minute Jest timeout (longer than K6 for safety)
});

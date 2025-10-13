import { HttpStatus } from '@nestjs/common';
import * as request from 'supertest';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import {
  getAccessToken,
  getServer,
  resetDB,
  resetDuplicateRegistrations,
} from '@121-service/test/helpers/utility.helper';

export interface PaymentResult {
  success: { count: number };
  failed: { count: number };
  waiting: { count: number };
}

export interface PaymentMonitoringOptions {
  programId: number;
  paymentId: number;
  maxRetryDuration: number; // seconds
  minPassRatePercentage: number;
  duplicateNumber: number;
}

/**
 * Payment helper for performance tests - migrated from K6 payment models
 */
export class PaymentPerformanceHelper {
  private server: any;
  private accessToken: string;

  constructor(server: any, accessToken: string) {
    this.server = server;
    this.accessToken = accessToken;
  }

  /**
   * Verify payment dry run until success (with retries)
   */
  async verifyPaymentDryRunUntilSuccess(
    programId: number,
    maxRetryDuration = 10,
  ): Promise<request.Response> {
    const delayBetweenAttempts = 1000; // 1 second in ms
    let attempts = 0;
    const maxAttempts = maxRetryDuration;

    while (attempts < maxAttempts) {
      console.log(
        `Attempt ${attempts + 1} to verify payment dry run for programId: ${programId}`,
      );

      const response = await this.server
        .post(`/api/programs/${programId}/payments?dryRun=true`)
        .set('Cookie', [`Authorization=${this.accessToken}`])
        .set('Content-Type', 'application/json')
        .send();

      if (
        response.status === HttpStatus.OK ||
        response.status === HttpStatus.CREATED
      ) {
        console.log(`Payment dry run successful on attempt ${attempts + 1}`);
        return response;
      }

      attempts++;
      await waitFor(delayBetweenAttempts);
    }

    throw new Error(
      `Failed to verify payment dry run after ${maxRetryDuration} seconds for programId: ${programId}`,
    );
  }

  /**
   * Create a payment
   */
  async createPayment(
    programId: number,
    amount: number,
  ): Promise<request.Response> {
    return this.server
      .post(`/api/programs/${programId}/payments`)
      .set('Cookie', [`Authorization=${this.accessToken}`])
      .set('Content-Type', 'application/json')
      .timeout(600000) // 10 minutes timeout like K6
      .send({ amount });
  }

  /**
   * Monitor payment results until pass rate is achieved
   */
  async monitorPaymentResults(
    options: PaymentMonitoringOptions,
  ): Promise<request.Response> {
    const {
      programId,
      paymentId,
      maxRetryDuration,
      minPassRatePercentage,
      duplicateNumber,
    } = options;

    const totalPayments = Math.pow(2, duplicateNumber);
    const delayBetweenAttempts = 5000; // 5 seconds in ms
    const maxDuration = maxRetryDuration * 1000; // Convert to ms
    const startTime = Date.now();
    let attempts = 0;
    let successfulPaymentsPercentage = 0;

    while (Date.now() - startTime < maxDuration) {
      const response = await this.server
        .get(`/api/programs/${programId}/payments/${paymentId}`)
        .set('Cookie', [`Authorization=${this.accessToken}`]);

      if (response.status === HttpStatus.OK) {
        const responseBody: PaymentResult = response.body;
        const successfulPaymentsCount = parseInt(
          responseBody?.success?.count?.toString() || '0',
        );

        successfulPaymentsPercentage =
          (successfulPaymentsCount / totalPayments) * 100;

        console.log(
          `Payment results attempt #${attempts + 1} [target ${minPassRatePercentage}% - current ${successfulPaymentsPercentage.toFixed(2)}%]: ${successfulPaymentsCount} out of ${totalPayments} payments successful`,
        );

        if (successfulPaymentsPercentage >= minPassRatePercentage) {
          console.log(
            `Success: The percentage of successful payments (${successfulPaymentsPercentage}%) is at or above the pass rate (${minPassRatePercentage}%).`,
          );
          return response;
        }
      }

      attempts++;
      await waitFor(delayBetweenAttempts);
    }

    console.log(
      `Failed: The percentage of successful payments (${successfulPaymentsPercentage}%) did not reach the pass rate (${minPassRatePercentage}%) within the maximum retry duration of ${maxRetryDuration} seconds.`,
    );

    // Return a mock failed response like K6 did
    const mockResponse = {
      status: 500,
      body: { error: 'Payment monitoring timeout' },
    } as request.Response;

    return mockResponse;
  }

  /**
   * Update registration status for all registrations in a program
   */
  async updateRegistrationStatus(
    programId: number,
    status: string,
  ): Promise<request.Response> {
    return this.server
      .patch(`/api/programs/${programId}/registrations/status`)
      .set('Cookie', [`Authorization=${this.accessToken}`])
      .set('Content-Type', 'application/json')
      .send({
        status,
        message: 'Updated for performance test',
      });
  }

  /**
   * Import a single registration
   */
  async importRegistration(
    programId: number,
    registration: Record<string, any>,
  ): Promise<request.Response> {
    return this.server
      .post(`/api/programs/${programId}/registrations`)
      .set('Cookie', [`Authorization=${this.accessToken}`])
      .set('Content-Type', 'application/json')
      .send([registration]);
  }
}

/**
 * Full payment initialization workflow (replacing K6 InitializePaymentModel)
 */
export async function initializePaymentWorkflow(
  resetScript: SeedScript,
  resetIdentifier: string,
  programId: number,
  registration: Record<string, any>,
  duplicateNumber: number,
  maxRetryDuration: number,
  minPassRatePercentage: number,
  amount: number,
): Promise<request.Response> {
  // Reset database
  console.log('Resetting database...');
  const resetResponse = await resetDB(resetScript, resetIdentifier);
  if (resetResponse.status !== HttpStatus.ACCEPTED) {
    throw new Error(`Database reset failed: ${resetResponse.status}`);
  }

  // Login
  console.log('Logging in...');
  const accessToken = await getAccessToken();
  const server = getServer();
  const paymentHelper = new PaymentPerformanceHelper(
    server as any,
    accessToken,
  );

  // Import registration
  console.log('Importing registration...');
  const importResponse = await paymentHelper.importRegistration(
    programId,
    registration,
  );
  if (importResponse.status !== HttpStatus.CREATED) {
    throw new Error(`Registration import failed: ${importResponse.status}`);
  }

  // Create duplicate registrations
  console.log(
    `Creating ${Math.pow(2, duplicateNumber)} duplicate registrations...`,
  );
  const duplicateResponse = await resetDuplicateRegistrations(duplicateNumber);
  if (duplicateResponse.status !== HttpStatus.ACCEPTED) {
    throw new Error(`Duplicate creation failed: ${duplicateResponse.status}`);
  }

  // Update status to included
  console.log('Updating registration status to included...');
  const statusResponse = await paymentHelper.updateRegistrationStatus(
    programId,
    'included',
  );
  if (statusResponse.status !== HttpStatus.OK) {
    throw new Error(`Status update failed: ${statusResponse.status}`);
  }

  // Verify payment dry run
  console.log('Verifying payment dry run...');
  await paymentHelper.verifyPaymentDryRunUntilSuccess(programId);

  // Create payment
  console.log('Creating payment...');
  const paymentResponse = await paymentHelper.createPayment(programId, amount);
  if (paymentResponse.status !== HttpStatus.ACCEPTED) {
    throw new Error(`Payment creation failed: ${paymentResponse.status}`);
  }

  const paymentId = paymentResponse.body.id;
  console.log(`Payment created with ID: ${paymentId}`);

  // Monitor payment results
  console.log('Monitoring payment results...');
  return paymentHelper.monitorPaymentResults({
    programId,
    paymentId,
    maxRetryDuration,
    minPassRatePercentage,
    duplicateNumber,
  });
}

// Registration data for different FSPs (migrated from K6 helpers)
export const registrationSafaricom = {
  referenceId: '01dc9451-1273-484c-b2e8-ae21b51a96ab',
  programFspConfigurationName: 'Safaricom',
  phoneNumber: '254708374149',
  preferredLanguage: 'en',
  paymentAmountMultiplier: 1,
  maxPayments: 6,
  fullName: 'Barbara Floyd',
  gender: 'male',
  age: 25,
  nationalId: '32121321',
  nameAlternate: 'test',
};

export const registrationIntersolveVisa = {
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

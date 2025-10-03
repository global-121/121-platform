import { HttpStatus } from '@nestjs/common';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { getEnvironmentNumber } from '@121-service/test/performance/helpers/config.helper';
import {
  initializePaymentWorkflow,
  registrationIntersolveVisa,
} from '@121-service/test/performance/helpers/payment.helper';
import { PerformanceTestHelper } from '@121-service/test/performance/helpers/performance.helper';

describe('Payment 100k+ Registrations Intersolve Visa Performance Test', () => {
  let performanceHelper: PerformanceTestHelper;

  // K6 equivalent configuration
  const duplicateNumber = getEnvironmentNumber('DUPLICATE_NUMBER', 5); // '17' leads to 131k registrations
  const resetScript = SeedScript.nlrcMultiple; // Using NLRC script for Intersolve
  const programId = 3; // Different program ID for Intersolve
  const maxRetryDuration = 4000; // seconds (66+ minutes)
  const minPassRatePercentage = 10;
  const amount = 10;

  beforeAll(async () => {
    // Initialize performance helper with K6-equivalent thresholds
    performanceHelper = new PerformanceTestHelper({
      httpErrorRate: 0.01, // Less than 1% HTTP errors
      minPassRate: minPassRatePercentage,
    });

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

  it('should process payment for 100k+ Intersolve Visa registrations within performance thresholds', async () => {
    const testStartTime = Date.now();

    console.log('Starting Intersolve Visa payment performance test...');

    // Execute the full payment workflow
    const startTime = Date.now();
    const paymentResult = await initializePaymentWorkflow(
      resetScript,
      'payment100kRegistrationIntersolveVisa.test.ts',
      programId,
      registrationIntersolveVisa,
      duplicateNumber,
      maxRetryDuration,
      minPassRatePercentage,
      amount,
    );

    // Validate the payment result
    performanceHelper.assertPerformance(
      paymentResult,
      startTime,
      'Payment workflow should complete successfully',
    );

    expect(paymentResult.status).toBe(HttpStatus.OK);

    const totalTestTime = Date.now() - testStartTime;
    console.log(`Total test time: ${Math.round(totalTestTime / 1000)} seconds`);

    // K6 test had 80-minute duration limit
    expect(totalTestTime).toBeLessThan(4800000); // 80 minutes in ms

    console.log(
      'Intersolve Visa payment performance test completed successfully',
    );
  }, 5400000); // 90-minute Jest timeout (longer than K6 for safety)
});

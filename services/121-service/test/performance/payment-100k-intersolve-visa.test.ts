import { HttpStatus } from '@nestjs/common';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  initializePaymentWorkflow,
  registrationIntersolveVisa,
} from '@121-service/test/performance/helpers/payment.helper';

// Get test configuration based on environment
const isRunningInCronjob = process.env.RUNNING_IN_CRONJOB === 'true';
const duplicateNumber = isRunningInCronjob ? 17 : 5; // Heavy load vs light load

describe('Payment 100k+ Registrations Intersolve Visa Performance Test', () => {
  const resetScript = SeedScript.nlrcMultiple; // Using NLRC script for Intersolve
  const programId = 3; // Different program ID for Intersolve
  const maxRetryDuration = 4000; // seconds (66+ minutes)
  const minPassRatePercentage = 10;
  const amount = 10;

  beforeAll(async () => {
    console.log(`Running Intersolve Visa payment test: cronjob=${isRunningInCronjob}, duplicateNumber=${duplicateNumber} (${Math.pow(2, duplicateNumber)} registrations)`);
  });

  it('should process payment for 100k+ Intersolve Visa registrations within performance thresholds', async () => {
    const testStartTime = Date.now();
    
    console.log('Starting Intersolve Visa payment performance test...');
    
    // Execute the full payment workflow
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
    expect(paymentResult.status).toBe(HttpStatus.OK);
    
    const totalTestTime = Date.now() - testStartTime;
    console.log(`Total test time: ${Math.round(totalTestTime / 1000)} seconds`);
    
    // Performance expectation based on environment
    const maxDuration = isRunningInCronjob ? 4800000 : 1800000; // 80 vs 30 minutes
    expect(totalTestTime).toBeLessThan(maxDuration);
    
    console.log('Intersolve Visa payment performance test completed successfully');
  }, isRunningInCronjob ? 5400000 : 2100000); // 90 vs 35 minute timeout
});

import { HttpStatus } from '@nestjs/common';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  initializePaymentWorkflow,
  registrationSafaricom,
} from '@121-service/test/performance/helpers/payment.helper';

// Get test configuration based on environment
const isRunningInCronjob = process.env.RUNNING_IN_CRONJOB === 'true';
const duplicateNumber = isRunningInCronjob ? 17 : 5; // Heavy load vs light load

describe('Payment 100k+ Registrations Safaricom Performance Test', () => {
  const resetScript = SeedScript.safaricomProgram;
  const programId = 1;
  const maxRetryDuration = 4000; // seconds (66+ minutes)
  const minPassRatePercentage = 10;
  const amount = 10;

  beforeAll(async () => {
    console.log(`Running Safaricom payment test: cronjob=${isRunningInCronjob}, duplicateNumber=${duplicateNumber} (${Math.pow(2, duplicateNumber)} registrations)`);
  });

  it('should process payment for 100k+ Safaricom registrations within performance thresholds', async () => {
    const testStartTime = Date.now();
    
    console.log('Starting Safaricom payment performance test...');
    
    // Execute the full payment workflow
    const paymentResult = await initializePaymentWorkflow(
      resetScript,
      'payment100kRegistrationSafaricom.test.ts',
      programId,
      registrationSafaricom,
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
    
    console.log('Safaricom payment performance test completed successfully');
  }, isRunningInCronjob ? 5400000 : 2100000); // 90 vs 35 minute timeout
});

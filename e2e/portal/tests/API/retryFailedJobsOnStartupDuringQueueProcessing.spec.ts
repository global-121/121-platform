import { expect, test } from '@playwright/test';

import { env } from '@121-service/src/env';

/**
 * This test verifies that failed jobs in the queue are retried when the service restarts.
 * It simulates a scenario where payments are initiated, the service is killed while jobs are
 * still in the queue, and then verifies that jobs are retried successfully after restart.
 *
 * This test was migrated from K6 to Playwright to maintain the ability to test service
 * restart scenarios from an external environment while removing the need to maintain K6
 * infrastructure for just this single test case.
 */

const DUPLICATE_NUMBER = '7'; // '7' leads to 128 registrations
const PROGRAM_ID = 3;
const MAX_RETRY_DURATION = 2000 * 1000; // Convert seconds to milliseconds
const MIN_PASS_RATE_PERCENTAGE = 100;
const TRANSFER_VALUE = 10;
const HEALTH_CHECK_TIMEOUT = 5000; // 5 seconds per health check
const HEALTH_CHECK_MAX_ATTEMPTS = 120; // Maximum 2 minutes waiting for service
const JOB_QUEUE_DELAY = 5000; // Wait 5 seconds for jobs to be queued

test.describe('Retry Failed Jobs On Startup During Queue Processing', () => {
  test('should retry failed jobs when service restarts during payment processing', async ({
    request,
  }) => {
    // Set longer timeout for this test since it includes service restart
    test.setTimeout(60 * 60 * 1000); // 60 minutes

    const baseUrl = env.EXTERNAL_121_SERVICE_URL || 'http://localhost:3000';

    // Step 1: Reset database with mock registrations
    await test.step('Reset database with mock registrations', async () => {
      const resetResponse = await request.post(`${baseUrl}/api/scripts/reset`, {
        data: {
          secret: env.RESET_SECRET,
        },
        params: {
          isApiTests: 'true',
          script: 'nlrc-multiple-mock-data',
          mockPowerNumberRegistrations: DUPLICATE_NUMBER,
          mockPv: 'true',
          mockOcw: 'true',
          resetIdentifier:
            'retryFailedJobsOnStartupDuringQueueProcessing.spec.ts',
        },
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(resetResponse.status()).toBe(202);
    });

    // Step 2: Login and establish session
    await test.step('Login to establish session', async () => {
      const loginResponse = await request.post(`${baseUrl}/api/users/login`, {
        data: {
          username: env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
          password: env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(loginResponse.status()).toBe(201);

      // Verify we have successful login timing
      const timing = loginResponse.headers()['x-response-time'];
      console.log(
        `Login completed ${timing ? `in ${timing}` : 'successfully'}`,
      );
    });

    // Step 3: Create payment
    let paymentId: string;
    await test.step('Create payment', async () => {
      const paymentResponse = await request.post(
        `${baseUrl}/api/programs/${PROGRAM_ID}/payments`,
        {
          data: {
            transferValue: TRANSFER_VALUE,
          },
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (paymentResponse.status() !== 202) {
        console.error('Payment creation failed:', await paymentResponse.text());
      }
      expect(paymentResponse.status()).toBe(202);

      const paymentData = await paymentResponse.json();
      paymentId = paymentData.id;
      expect(paymentId).toBeDefined();
      console.log(`Created payment with ID: ${paymentId}`);
    });

    // Step 4: Wait briefly for jobs to be added to queue but not complete
    await test.step('Wait for jobs to be queued', async () => {
      console.log('Waiting for jobs to be added to queue...');
      await new Promise((resolve) => setTimeout(resolve, JOB_QUEUE_DELAY));
    });

    // Step 5: Kill the 121 service
    await test.step('Kill 121 service', async () => {
      console.log('Killing 121 service...');
      try {
        await request.post(`${baseUrl}/api/test/kill-service`, {
          data: {
            secret: env.RESET_SECRET,
          },
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 second timeout
        });
        // The service should be killed, so we might not get a clean response
      } catch (error) {
        // Expected - service was killed, connection terminated
        console.log(
          'Service kill command sent (connection terminated as expected)',
        );
      }
    });

    // Step 6: Wait for service to restart and become available
    await test.step('Wait for service to restart', async () => {
      console.log('Waiting for service to restart...');
      let serviceUp = false;
      let attempts = 0;

      while (!serviceUp && attempts < HEALTH_CHECK_MAX_ATTEMPTS) {
        try {
          const healthResponse = await request.get(
            `${baseUrl}/api/health/health`,
            {
              timeout: HEALTH_CHECK_TIMEOUT,
            },
          );
          if (healthResponse.status() === 200) {
            serviceUp = true;
            console.log('Service is back up!');
          }
        } catch (error) {
          // Service not yet available, continue waiting
        }

        if (!serviceUp) {
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
          attempts++;
          if (attempts % 10 === 0) {
            console.log(
              `Still waiting for service restart... (attempt ${attempts}/${HEALTH_CHECK_MAX_ATTEMPTS})`,
            );
          }
        }
      }

      expect(serviceUp).toBe(true);
    });

    // Step 7: Monitor payment results until 100% success
    await test.step('Monitor payment results until completion', async () => {
      const totalPayments = Math.pow(2, parseInt(DUPLICATE_NUMBER));
      const delayBetweenAttempts = 5000; // 5 seconds in milliseconds
      let attempts = 0;
      let successfulPaymentsPercentage = 0;
      const maxAttempts = Math.floor(MAX_RETRY_DURATION / delayBetweenAttempts);

      console.log(
        `Monitoring ${totalPayments} payments for ${MIN_PASS_RATE_PERCENTAGE}% success rate...`,
      );

      while (attempts < maxAttempts) {
        const paymentResultsResponse = await request.get(
          `${baseUrl}/api/programs/${PROGRAM_ID}/payments/${paymentId}`,
        );

        if (paymentResultsResponse.status() !== 200) {
          const errorBody = await paymentResultsResponse.text();
          console.error('Payment results request failed:', errorBody);
        }
        expect(paymentResultsResponse.status()).toBe(200);

        const responseBody = await paymentResultsResponse.json();
        const successfulPaymentsCount = parseInt(
          responseBody?.success?.count ?? '0',
        );

        successfulPaymentsPercentage =
          (successfulPaymentsCount / totalPayments) * 100;

        console.log(
          `Payment results attempt #${attempts + 1} [target ${MIN_PASS_RATE_PERCENTAGE}% - current ${successfulPaymentsPercentage.toFixed(2)}%]: ${successfulPaymentsCount} out of ${totalPayments} payments successful`,
        );

        if (successfulPaymentsPercentage >= MIN_PASS_RATE_PERCENTAGE) {
          console.log(
            `Success: The percentage of successful payments (${successfulPaymentsPercentage}%) is at or above the pass rate (${MIN_PASS_RATE_PERCENTAGE}%).`,
          );
          break;
        }

        attempts++;
        if (attempts < maxAttempts) {
          await new Promise((resolve) =>
            setTimeout(resolve, delayBetweenAttempts),
          );
        }
      }

      // Final assertion
      if (successfulPaymentsPercentage < MIN_PASS_RATE_PERCENTAGE) {
        console.error(
          `Failed: The percentage of successful payments (${successfulPaymentsPercentage}%) did not reach the pass rate (${MIN_PASS_RATE_PERCENTAGE}%) within the maximum retry duration of ${MAX_RETRY_DURATION / 1000} seconds.`,
        );
      }

      expect(successfulPaymentsPercentage).toBeGreaterThanOrEqual(
        MIN_PASS_RATE_PERCENTAGE,
      );
    });
  });
});

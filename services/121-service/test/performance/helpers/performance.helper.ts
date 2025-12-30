import * as request from 'supertest';

import { waitFor } from '@121-service/src/utils/waitFor.helper';
import { getPaymentSummary } from '@121-service/test/helpers/program.helper';
import { getServer } from '@121-service/test/helpers/utility.helper';
import {
  PaymentResultsParams,
  PaymentResultsResult,
} from '@121-service/test/performance/interfaces/payment-results.interface';
import {
  RegistrationStatusParams,
  RegistrationStatusResponse,
  RegistrationStatusResult,
} from '@121-service/test/performance/interfaces/registration-status.interface';
import { StatusOverviewItem } from '@121-service/test/performance/interfaces/status-overview.interface';

export function calculateMilliseconds({
  minutes,
}: {
  minutes: number;
}): number {
  return minutes * 60 * 1000;
}

export async function getPaymentResults({
  programId,
  paymentId,
  accessToken,
  totalAmountPowerOfTwo,
  passRate,
  maxRetryDurationMs = 120_000, // 2 minutes default
  delayBetweenAttemptsMs = 5_000, // 5 seconds default
  verbose = true,
}: PaymentResultsParams): Promise<PaymentResultsResult> {
  const startTime = Date.now();
  const totalPayments = Math.pow(2, totalAmountPowerOfTwo);
  let attempts = 0;
  let successfulPaymentsPercentage = 0;
  let successfulPaymentsCount = 0;
  let lastResponse: any;

  while (Date.now() - startTime < maxRetryDurationMs) {
    attempts++;

    const { response, successCount, shouldContinue } =
      await processPaymentSummaryResponse(
        programId,
        paymentId,
        accessToken,
        verbose,
        delayBetweenAttemptsMs,
      );

    lastResponse = response;

    if (shouldContinue) {
      continue;
    }

    successfulPaymentsCount = successCount;
    successfulPaymentsPercentage = calculateSuccessPercentage(
      successfulPaymentsCount,
      totalPayments,
    );

    if (verbose) {
      console.log(
        `Payment results attempt #${attempts} [target ${passRate}% - current ${successfulPaymentsPercentage.toFixed(2)}%]: ${successfulPaymentsCount} out of ${totalPayments} payments successful`,
      );
    }

    if (successfulPaymentsPercentage >= passRate) {
      if (verbose) {
        console.log(
          `Success: The percentage of successful payments (${successfulPaymentsPercentage.toFixed(2)}%) is at or above the pass rate (${passRate}%).`,
        );
      }

      return createSuccessResult(
        successfulPaymentsCount,
        totalPayments,
        successfulPaymentsPercentage,
        attempts,
        Date.now() - startTime,
        lastResponse,
      );
    }

    await waitFor(delayBetweenAttemptsMs);
  }

  const elapsedTimeMs = Date.now() - startTime;

  if (verbose) {
    console.log(
      `Failed: The percentage of successful payments (${successfulPaymentsPercentage.toFixed(2)}%) did not reach the pass rate (${passRate}%) within the maximum retry duration of ${maxRetryDurationMs}ms (${Math.round(maxRetryDurationMs / 1000)}s).`,
    );
  }

  return createFailureResult(
    successfulPaymentsCount,
    totalPayments,
    successfulPaymentsPercentage,
    attempts,
    elapsedTimeMs,
    lastResponse,
  );
}

export async function updateRegistrationStatusAndLog({
  programId,
  status,
  accessToken,
  maxRetryDurationMs = 120_000, // 2 minutes default
  delayBetweenAttemptsMs = 3_000, // 3 seconds default
  verbose = true,
}: RegistrationStatusParams): Promise<RegistrationStatusResult> {
  const startTime = Date.now();

  // Update registration status
  const responseStatusChange = await updateRegistrationStatus(
    programId,
    status,
    accessToken,
  );

  if (!isResponseSuccessful(responseStatusChange.status)) {
    return {
      success: false,
      response: responseStatusChange,
      attempts: 1,
      elapsedTimeMs: Date.now() - startTime,
    };
  }

  const responseBody: RegistrationStatusResponse = responseStatusChange.body;

  if (verbose) {
    console.log(
      `totalFilterCount: ${responseBody.totalFilterCount}, applicableCount: ${responseBody.applicableCount}, nonApplicableCount: ${responseBody.nonApplicableCount}`,
    );
  }

  let attempts = 0;
  let registrationCount: number = await getRegistrationCountForStatus(
    programId,
    status,
    accessToken,
  );

  // Helper function to safely convert to number
  const toNumber = (value: unknown): number => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  const expectedCount = toNumber(responseBody.applicableCount);

  // Wait for counts to match
  while (Date.now() - startTime < maxRetryDurationMs) {
    attempts++;

    registrationCount = await getRegistrationCountForStatus(
      programId,
      status,
      accessToken,
    );

    // Ensure both values are numbers
    const normalizedExpectedCount = Number(expectedCount);
    const normalizedRegistrationCount = Number(registrationCount);

    if (verbose) {
      console.log(
        `Checking counts: applicableCount = ${normalizedExpectedCount}, registrationCount = ${normalizedRegistrationCount}`,
      );
    }

    // If counts match, exit the loop immediately
    if (normalizedExpectedCount === normalizedRegistrationCount) {
      if (verbose) {
        console.log(
          `Registration count matched: ${normalizedRegistrationCount} registrations with status '${status}'`,
        );
      }
      break;
    }

    await waitFor(delayBetweenAttemptsMs);
  }

  const success = expectedCount === registrationCount;

  return {
    success,
    response: responseStatusChange,
    attempts,
    elapsedTimeMs: Date.now() - startTime,
  };
}

function isResponseSuccessful(status: number): boolean {
  return status >= 200 && status < 300;
}

function calculateSuccessPercentage(
  successCount: number,
  totalPayments: number,
): number {
  return (successCount / totalPayments) * 100;
}

function createSuccessResult(
  successfulPaymentsCount: number,
  totalPayments: number,
  successfulPaymentsPercentage: number,
  attempts: number,
  elapsedTimeMs: number,
  lastResponse: any,
): PaymentResultsResult {
  return {
    success: true,
    successfulPaymentsCount,
    totalPayments,
    successfulPaymentsPercentage,
    attempts,
    elapsedTimeMs,
    lastResponse,
  };
}

function createFailureResult(
  successfulPaymentsCount: number,
  totalPayments: number,
  successfulPaymentsPercentage: number,
  attempts: number,
  elapsedTimeMs: number,
  lastResponse: any,
): PaymentResultsResult {
  return {
    success: false,
    successfulPaymentsCount,
    totalPayments,
    successfulPaymentsPercentage,
    attempts,
    elapsedTimeMs,
    lastResponse,
  };
}

async function processPaymentSummaryResponse(
  programId: number,
  paymentId: number,
  accessToken: string,
  verbose: boolean,
  delayBetweenAttemptsMs: number,
): Promise<{ response: any; successCount: number; shouldContinue: boolean }> {
  try {
    const paymentSummaryResponse = await getPaymentSummary({
      programId,
      paymentId,
      accessToken,
    });
    if (!isResponseSuccessful(paymentSummaryResponse.status)) {
      if (verbose) {
        console.log(
          `Payment summary request failed with status: ${paymentSummaryResponse.status}`,
        );
      }
      await waitFor(delayBetweenAttemptsMs);
      return {
        response: paymentSummaryResponse,
        successCount: 0,
        shouldContinue: true,
      };
    }

    const successCount = parseInt(
      paymentSummaryResponse.body?.success?.count || '0',
      10,
    );
    return {
      response: paymentSummaryResponse,
      successCount,
      shouldContinue: false,
    };
  } catch (error) {
    if (verbose) {
      console.error(`Payment summary request failed:`, error);
    }
    await waitFor(delayBetweenAttemptsMs);
    return { response: null, successCount: 0, shouldContinue: true };
  }
}

function updateRegistrationStatus(
  programId: number,
  status: string,
  accessToken: string,
): Promise<request.Response> {
  return getServer()
    .patch(`/programs/${programId}/registrations/status`)
    .set('Cookie', [accessToken])
    .send({
      status,
      message: 'Long enough acceptable message',
    });
}

function getStatusOverview(
  programId: number,
  accessToken: string,
): Promise<request.Response> {
  return getServer()
    .get(`/programs/${programId}/metrics/registration-status`)
    .set('Cookie', [accessToken])
    .send();
}

async function getRegistrationCountForStatus(
  programId: number,
  status: string,
  accessToken: string,
): Promise<number> {
  const statusOverview = await getStatusOverview(programId, accessToken);
  const statusOverviewBody: StatusOverviewItem[] = statusOverview.body;

  const item = statusOverviewBody.find((item) => item.status === status);
  return item?.statusCount ?? 0;
}

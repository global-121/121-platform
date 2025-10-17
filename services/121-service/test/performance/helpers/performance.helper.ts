import * as request from 'supertest';

import { getPaymentSummary } from '@121-service/test/helpers/program.helper';
import { getServer } from '@121-service/test/helpers/utility.helper';

export type JsonRecord = Readonly<Record<string, unknown>>;

export function jsonToCsv(data: JsonRecord[]): string {
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

// Helper function that waits and refreshes till the payment is processed or timeout occurs
interface PaymentResultsParams {
  readonly programId: number;
  readonly paymentId: number;
  readonly accessToken: string;
  readonly totalAmountPowerOfTwo: number;
  readonly passRate: number;
  readonly maxRetryDurationMs?: number;
  readonly delayBetweenAttemptsMs?: number;
  readonly verbose?: boolean;
}

interface PaymentResultsResult {
  readonly success: boolean;
  readonly successfulPaymentsCount: number;
  readonly totalPayments: number;
  readonly successfulPaymentsPercentage: number;
  readonly attempts: number;
  readonly elapsedTimeMs: number;
  readonly lastResponse?: any;
}

interface Kill121ServiceParams {
  readonly secret?: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function logPaymentProgress(
  attempts: number,
  passRate: number,
  successPercentage: number,
  successCount: number,
  totalPayments: number,
): void {
  console.log(
    `Payment results attempt #${attempts} [target ${passRate}% - current ${successPercentage.toFixed(2)}%]: ${successCount} out of ${totalPayments} payments successful`,
  );
}

function logSuccessMessage(successPercentage: number, passRate: number): void {
  console.log(
    `Success: The percentage of successful payments (${successPercentage.toFixed(2)}%) is at or above the pass rate (${passRate}%).`,
  );
}

function logFailureMessage(
  successPercentage: number,
  passRate: number,
  maxRetryDurationMs: number,
): void {
  console.log(
    `Failed: The percentage of successful payments (${successPercentage.toFixed(2)}%) did not reach the pass rate (${passRate}%) within the maximum retry duration of ${maxRetryDurationMs}ms (${Math.round(maxRetryDurationMs / 1000)}s).`,
  );
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
      await sleep(delayBetweenAttemptsMs);
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
    await sleep(delayBetweenAttemptsMs);
    return { response: null, successCount: 0, shouldContinue: true };
  }
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
      logPaymentProgress(
        attempts,
        passRate,
        successfulPaymentsPercentage,
        successfulPaymentsCount,
        totalPayments,
      );
    }

    if (successfulPaymentsPercentage >= passRate) {
      if (verbose) {
        logSuccessMessage(successfulPaymentsPercentage, passRate);
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

    await sleep(delayBetweenAttemptsMs);
  }

  const elapsedTimeMs = Date.now() - startTime;

  if (verbose) {
    logFailureMessage(
      successfulPaymentsPercentage,
      passRate,
      maxRetryDurationMs,
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

export async function kill121Service({
  secret = 'fill_in_secret',
}: Kill121ServiceParams = {}): Promise<request.Response> {
  const body = { secret };

  return await getServer()
    .post(`/test/kill-service`)
    .set('Content-Type', 'application/json')
    .send(body);
}

export async function isServiceUp(): Promise<request.Response> {
  return await getServer()
    .get(`/health/health`)
    .set('Accept', 'application/json');
}

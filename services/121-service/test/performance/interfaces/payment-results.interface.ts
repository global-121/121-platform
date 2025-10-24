export interface PaymentResultsParams {
  readonly programId: number;
  readonly paymentId: number;
  readonly accessToken: string;
  readonly totalAmountPowerOfTwo: number;
  readonly passRate: number;
  readonly maxRetryDurationMs?: number;
  readonly delayBetweenAttemptsMs?: number;
  readonly verbose?: boolean;
}

export interface PaymentResultsResult {
  readonly success: boolean;
  readonly successfulPaymentsCount: number;
  readonly totalPayments: number;
  readonly successfulPaymentsPercentage: number;
  readonly attempts: number;
  readonly elapsedTimeMs: number;
  readonly lastResponse?: any;
}

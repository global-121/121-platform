export interface RegistrationStatusParams {
  readonly programId: number;
  readonly status: string;
  readonly accessToken: string;
  readonly maxRetryDurationMs?: number;
  readonly delayBetweenAttemptsMs?: number;
  readonly verbose?: boolean;
}

export interface RegistrationStatusResult {
  readonly success: boolean;
  readonly response: any;
  readonly attempts: number;
  readonly elapsedTimeMs: number;
}

export interface StatusOverviewItem {
  readonly status: string;
  readonly statusCount: number;
}

export interface RegistrationStatusResponse {
  readonly totalFilterCount: number;
  readonly applicableCount: number;
  readonly nonApplicableCount: number;
}

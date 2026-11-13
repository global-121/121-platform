import type { LogLevel } from '@nestjs/common';
import { KnownSeverityLevel } from 'applicationinsights';

export const APPLICATION_INSIGHTS_SHUTDOWN_TIMEOUT_MS = 5_000;

export const APPLICATION_INSIGHTS_LOG_SEVERITY: Record<
  LogLevel,
  KnownSeverityLevel
> = {
  verbose: KnownSeverityLevel.Verbose,
  debug: KnownSeverityLevel.Verbose,
  log: KnownSeverityLevel.Information,
  warn: KnownSeverityLevel.Warning,
  error: KnownSeverityLevel.Error,
  fatal: KnownSeverityLevel.Critical,
};

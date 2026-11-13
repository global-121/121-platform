import { ConsoleLogger, LogLevel } from '@nestjs/common';
import { defaultClient } from 'applicationinsights';

import { env } from '@121-service/src/env';
import { APPLICATION_INSIGHTS_LOG_SEVERITY } from '@121-service/src/telemetry/application-insights.const';

export class ApplicationInsightsLogger extends ConsoleLogger {
  protected override printMessages(
    messages: unknown[],
    context = '',
    logLevel: LogLevel = 'log',
    writeStreamType?: 'stdout' | 'stderr',
    errorStack?: unknown,
    params?: Record<string, unknown>,
  ): void {
    super.printMessages(
      messages,
      context,
      logLevel,
      writeStreamType,
      errorStack,
      params,
    );
    if (!env.APPLICATIONINSIGHTS_CONNECTION_STRING || !defaultClient) {
      return;
    }

    for (const message of messages) {
      try {
        const telemetry = {
          severity: APPLICATION_INSIGHTS_LOG_SEVERITY[logLevel],
          properties: { context, logLevel },
        };
        if (message instanceof Error) {
          defaultClient.trackException({ exception: message, ...telemetry });
          continue;
        }

        defaultClient.trackTrace({
          message:
            typeof message === 'string'
              ? message
              : 'Non-string NestJS log message omitted',
          ...telemetry,
        });
      } catch (error) {
        console.error(
          'Failed to export NestJS log to Application Insights:',
          error,
        );
      }
    }
  }
}

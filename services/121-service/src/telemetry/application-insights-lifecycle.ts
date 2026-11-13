import { defaultClient, KnownSeverityLevel } from 'applicationinsights';

import { env } from '@121-service/src/env';
import { APPLICATION_INSIGHTS_SHUTDOWN_TIMEOUT_MS } from '@121-service/src/telemetry/application-insights.const';

export async function shutdownApplicationInsights(): Promise<void> {
  if (!env.APPLICATIONINSIGHTS_CONNECTION_STRING || !defaultClient) {
    return;
  }

  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      (async () => {
        await defaultClient.flush();
        await defaultClient.shutdown();
      })(),
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(
          () => reject(new Error('Application Insights shutdown timed out')),
          APPLICATION_INSIGHTS_SHUTDOWN_TIMEOUT_MS,
        );
      }),
    ]);
  } catch (error) {
    console.error('Application Insights shutdown failed:', error);
  } finally {
    clearTimeout(timeout);
  }
}

export async function handleFatalError({
  error,
}: {
  error: Error;
}): Promise<void> {
  console.error('Uncaught Exception:', error);
  if (env.APPLICATIONINSIGHTS_CONNECTION_STRING && defaultClient) {
    try {
      defaultClient.trackException({
        exception: error,
        severity: KnownSeverityLevel.Critical,
      });
      defaultClient.trackTrace({
        message: 'Uncaught Exception: restarting',
        severity: KnownSeverityLevel.Critical,
      });
    } catch (trackingError) {
      console.error('Failed to record fatal exception:', trackingError);
    }
  }
  await shutdownApplicationInsights();
}

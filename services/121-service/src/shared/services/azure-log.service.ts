import { Injectable } from '@nestjs/common';
import {
  defaultClient,
  KnownSeverityLevel,
  TelemetryClient,
} from 'applicationinsights';

import { IS_PRODUCTION } from '@121-service/src/config';
import { env } from '@121-service/src/env';

@Injectable()
export class AzureLogService {
  defaultClient: TelemetryClient;

  public constructor() {
    if (env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
      this.defaultClient = defaultClient;
    }
  }

  public logError(error: Error, alert: boolean): void {
    if (!this.defaultClient) {
      throw error;
    }

    console.log('Logging error to Azure - :', error);
    try {
      this.defaultClient.trackException({
        exception: error,
        severity: alert ? KnownSeverityLevel.Critical : KnownSeverityLevel.Error,
      });
    } catch (trackExceptionError) {
      console.error('An error occurred in logError:', trackExceptionError);
    }

    void this.flushLogs();
  }

  private async flushLogs(): Promise<void> {
    try {
      await this.defaultClient.flush();
    } catch (flushError) {
      console.error(
        'An error occurred in AzureLogService::flushLogs:',
        flushError,
      );
    }
  }

  public traceAzure(message: string): void {
    if (!IS_PRODUCTION) {
      console.log(message);
    }
    if (!this.defaultClient) {
      return;
    }
    this.defaultClient.trackTrace({ message });
    void this.flushLogs();
  }

  public trackEvent({
    name,
    properties,
  }: {
    name: string;
    properties: Record<string, string>;
  }): void {
    if (!IS_PRODUCTION) {
      console.log(`Event: ${name}`, properties);
    }
    if (!this.defaultClient) {
      return;
    }

    try {
      this.defaultClient.trackEvent({ name, properties });
    } catch (trackEventError) {
      console.error('An error occurred in trackEvent:', trackEventError);
    }

    void this.flushLogs();
  }
}

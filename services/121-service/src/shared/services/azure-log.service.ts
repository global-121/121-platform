import { Injectable } from '@nestjs/common';
import { KnownSeverityLevel, TelemetryClient } from 'applicationinsights';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import appInsights = require('applicationinsights');

@Injectable()
export class AzureLogService {
  defaultClient: TelemetryClient;

  public constructor() {
    if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
      this.defaultClient = appInsights.defaultClient;
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
        severity: alert
          ? KnownSeverityLevel.Critical
          : KnownSeverityLevel.Error,
      });
    } catch (trackExceptionError) {
      console.error('An error occured in logError:', trackExceptionError);
    }

    this.flushLogs();
  }

  private flushLogs(): void {
    this.defaultClient
      .flush()
      .then(() => {
        return;
      })
      .catch((flushError) => {
        console.error('An error occured in logError:', flushError);
      });
  }
}

import { Injectable } from '@nestjs/common';
import { KnownSeverityLevel, TelemetryClient } from 'applicationinsights';

@Injectable()
export class AzureLogService {
  defaultClient: TelemetryClient;

  public constructor() {
    if (process.env.APPLICATION_INSIGHT_IKEY) {
      this.defaultClient = new TelemetryClient(
        process.env.APPLICATION_INSIGHT_IKEY,
      );
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

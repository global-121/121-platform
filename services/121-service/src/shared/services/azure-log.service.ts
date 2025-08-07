import { Injectable } from '@nestjs/common';
import { defaultClient, TelemetryClient } from 'applicationinsights';
import { SeverityLevel } from 'applicationinsights/out/Declarations/Contracts';

import { env } from '@121-service/src/env';

@Injectable()
export class AzureLogService {
  defaultClient: TelemetryClient;

  public constructor() {
    if (!!env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
      this.defaultClient = defaultClient;
    }
  }

  public logError(error: Error, alert: boolean): void {
    console.log('🚀 ~ AzureLogService ~ logError ~ error:', error);
    if (!this.defaultClient) {
      throw error;
    }

    console.log('Logging error to Azure - :', error);
    try {
      this.defaultClient.trackException({
        exception: error,
        severity: alert ? SeverityLevel.Critical : SeverityLevel.Error,
      });
    } catch (trackExceptionError) {
      console.error('An error occured in logError:', trackExceptionError);
    }

    this.flushLogs();
  }

  private flushLogs(): void {
    try {
      this.defaultClient.flush();
    } catch (flushError) {
      console.error(
        'An error occured in AzureLogService::flushLogs:',
        flushError,
      );
    }
  }

  public consoleLogAndTraceAzure(message: string): void {
    console.log(message);
    if (!this.defaultClient) {
      return;
    }
    this.defaultClient.trackTrace({ message });
    this.flushLogs();
  }
}

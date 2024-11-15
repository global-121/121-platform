import { Injectable } from '@nestjs/common';
import { TelemetryClient } from 'applicationinsights';
import { SeverityLevel } from 'applicationinsights/out/Declarations/Contracts';

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
    try {
      if (this.defaultClient) {
        console.log('Logging error to Azure - :', error);
        this.defaultClient.trackException({
          exception: error,
          severity: alert ? SeverityLevel.Critical : SeverityLevel.Error,
        });
        this.defaultClient.flush();
      } else {
        throw error;
      }
    } catch (error) {
      console.log('An error occured in logError: ', error);
    }
  }
}

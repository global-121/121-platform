import { Injectable } from '@angular/core';
import {
  ApplicationInsights,
  ITelemetryItem,
} from '@microsoft/applicationinsights-web';
import { SeverityLevel } from 'src/app/models/severity-level.enum';
import { environment } from 'src/environments/environment';
import { LoggingEvent } from '../models/logging-event.enum';

@Injectable()
export class LoggingService {
  appInsights: ApplicationInsights;
  appInsightsEnabled: boolean;

  constructor() {
    this.setupApplicationInsights();
  }

  private setupApplicationInsights() {
    if (!environment.ai_ikey || !environment.ai_endpoint) {
      return;
    }
    this.appInsights = new ApplicationInsights({
      config: {
        connectionString: `InstrumentationKey=${environment.ai_ikey};IngestionEndpoint=${environment.ai_endpoint}`,
        instrumentationKey: environment.ai_ikey,
        enableAutoRouteTracking: true,
        isCookieUseDisabled: true,
        isStorageUseDisabled: true,
        enableSessionStorageBuffer: true,
      },
    });

    this.appInsights.loadAppInsights();
    this.appInsights.addTelemetryInitializer(this.addTelemetryProcessor);
    this.appInsightsEnabled = true;
  }

  private addTelemetryProcessor(envelope: ITelemetryItem): boolean {
    // filter missing audio files
    if (
      envelope.baseData.responseCode === 404 &&
      envelope.baseData.name.match('/assets/i18n/')
    ) {
      return false;
    }

    // only if all criteria pass then log:
    return true;
  }

  public logPageView(name?: string): void {
    if (this.appInsightsEnabled) {
      this.appInsights.trackPageView({ name });
    }
    this.displayOnConsole(`logPageView: ${name}`, SeverityLevel.Information);
  }

  public logError(error: any, severityLevel?: SeverityLevel): void {
    this.displayOnConsole(error, severityLevel);
  }

  public logEvent(
    name: LoggingEvent | string,
    properties?: { [key: string]: any },
  ): void {
    if (this.appInsightsEnabled) {
      this.appInsights.trackEvent({ name }, properties);
    }
    this.displayOnConsole(
      `logEvent: ${name} - properties: ${JSON.stringify(properties)}`,
      SeverityLevel.Information,
    );
  }

  public logException(exception: Error, severityLevel?: SeverityLevel): void {
    if (this.appInsightsEnabled) {
      this.appInsights.trackException({
        exception,
        severityLevel,
      });
    }
    this.displayOnConsole(exception, severityLevel);
  }

  public logTrace(message: string, properties?: { [key: string]: any }): void {
    if (this.appInsightsEnabled) {
      this.appInsights.trackTrace({ message }, properties);
    }
    this.displayOnConsole(
      `logTrace: ${message} - properties: ${JSON.stringify(properties)}`,
    );
  }

  private displayOnConsole(
    error: any,
    severityLevel: SeverityLevel = SeverityLevel.Error,
  ): void {
    if (environment.production) {
      return;
    }

    switch (severityLevel) {
      case SeverityLevel.Critical:
      case SeverityLevel.Error:
        console.error(error);
        break;
      case SeverityLevel.Warning:
        console.warn(error);
        break;
      case SeverityLevel.Information:
        console.log(error);
        break;
    }
  }
}

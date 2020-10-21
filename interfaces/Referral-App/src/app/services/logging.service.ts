import { Injectable } from '@angular/core';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { SeverityLevel } from 'src/app/models/severity-level.model';
import { environment } from 'src/environments/environment';

@Injectable()
export class LoggingService {
  appInsights: ApplicationInsights;
  appInsightsEnabled: boolean;

  constructor() {
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

    this.appInsightsEnabled = true;
    this.appInsights.loadAppInsights();
  }

  logPageView(name?: string) {
    if (this.appInsightsEnabled) {
      this.appInsights.trackPageView({ name });
    } else {
      this.displayOnConsole(
        'trackPageView - name: ' + name,
        SeverityLevel.Information,
      );
    }
  }

  logError(error: any, severityLevel?: SeverityLevel) {
    this.displayOnConsole(error, severityLevel);
  }

  logEvent(name: string, properties?: { [key: string]: any }) {
    if (this.appInsightsEnabled) {
      this.appInsights.trackEvent({ name }, properties);
    } else {
      this.displayOnConsole(
        'logEvent - name: ' +
          name +
          ' properties: ' +
          JSON.stringify(properties),
        SeverityLevel.Information,
      );
    }
  }

  logException(exception: Error, severityLevel?: SeverityLevel) {
    if (this.appInsightsEnabled) {
      this.appInsights.trackException({
        exception,
        severityLevel,
      });
    } else {
      this.displayOnConsole(exception, severityLevel);
    }
  }

  logTrace(message: string, properties?: { [key: string]: any }) {
    if (this.appInsightsEnabled) {
      this.appInsights.trackTrace({ message }, properties);
    } else {
      this.displayOnConsole(
        'logTrace - message: ' +
          message +
          ' properties: ' +
          JSON.stringify(properties),
        SeverityLevel.Information,
      );
    }
  }

  private displayOnConsole(
    error: any,
    severityLevel: SeverityLevel = SeverityLevel.Error,
  ) {
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

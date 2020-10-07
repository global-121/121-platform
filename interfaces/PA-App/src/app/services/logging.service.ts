import { Injectable } from '@angular/core';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { SeverityLevel } from 'src/app/models/severity-level.model';
import { environment } from 'src/environments/environment';

@Injectable()
export class LoggingService {
  appInsights: ApplicationInsights;
  constructor() {
    if (!environment.ai_ikey || !environment.ai_endpoint) {
      return;
    }
      this.appInsights = new ApplicationInsights({
        config: {
          connectionString:
            'InstrumentationKey=' +
            environment.ai_ikey +
            ';IngestionEndpoint=' +
            environment.ai_endpoint,
          instrumentationKey: environment.ai_ikey,
          enableAutoRouteTracking: true,
        },
      });

      this.appInsights.loadAppInsights();
      this.appInsights.addTelemetryInitializer(this.addTelemetryProcessor);
    }
  }

  addTelemetryProcessor(envelope: any) {
    const baseData = envelope.baseData;

    // filter audio files
    if (
      baseData.responseCode === 404 &&
      baseData.name.match(
        '/assets/i18n/(en|de)/[a-z.-]*.(en|ny_MW|tuv_KE|saq_KE|om_ET).(webm|mp3)',
      )
    ) {
      return false;
    }

    // filter/sample data

    return false;
  }

  logPageView(name?: string, url?: string) {
    if (environment.ai_ikey && environment.ai_endpoint) {
      this.appInsights.trackPageView({
        name: name,
        uri: url,
      });
    }
  }

  logError(error: any, severityLevel?: SeverityLevel) {
    this.displayOnConsole(error, severityLevel);
  }

  logEvent(name: string, properties?: { [key: string]: any }) {
    if (environment.ai_ikey && environment.ai_endpoint) {
      this.appInsights.trackEvent({ name: name }, properties);
    }
  }

  logException(exception: Error, severityLevel?: SeverityLevel) {
    if (environment.ai_ikey && environment.ai_endpoint) {
      this.appInsights.trackException({
        exception: exception,
        severityLevel: severityLevel,
      });
    } else {
      this.displayOnConsole(exception, severityLevel);
    }
  }

  logTrace(message: string, properties?: { [key: string]: any }) {
    if (environment.ai_ikey && environment.ai_endpoint) {
      this.appInsights.trackTrace({ message: message }, properties);
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

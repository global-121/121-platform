import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { SeverityLevel } from 'src/app/models/severity-level.enum';
import { environment } from 'src/environments/environment';
import {
  LoggingEvent,
  LoggingEventCategory,
} from '../models/logging-event.enum';

/**
 * Access to the global window variable.
 */
declare var window: {
  [key: string]: any;
  prototype: Window;
  new (): Window;
};

@Injectable()
export class LoggingService {
  matomoEnabled: boolean;

  appInsights: ApplicationInsights;
  appInsightsEnabled: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId) {
    this.setupMatomo();
    this.setupApplicationInsights();
  }

  private setupMatomo() {
    if (
      !environment.matomo_endpoint_api ||
      !environment.matomo_endpoint_js ||
      !environment.matomo_id ||
      !isPlatformBrowser(this.platformId)
    ) {
      return;
    }

    window._paq = window._paq || [];
    window._paq.push(['disableCookies']);
    window._paq.push(['enableLinkTracking']);
    window._paq.push(['enableHeartBeatTimer']);

    (() => {
      window._paq.push(['setTrackerUrl', environment.matomo_endpoint_api]);
      window._paq.push(['setSiteId', environment.matomo_id]);

      const script = document.createElement('script');
      script.async = true;
      script.src = environment.matomo_endpoint_js;
      document.head.appendChild(script);

      this.matomoEnabled = true;
    })();
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
    this.appInsightsEnabled = true;
  }

  public logPageView(name?: string): void {
    if (this.matomoEnabled) {
      window._paq.push(['setDocumentTitle', name || document.title]);
      window._paq.push(['trackPageView']);
    }
    if (this.appInsightsEnabled) {
      this.appInsights.trackPageView({ name });
    }
    this.displayOnConsole(`logPageView: ${name}`, SeverityLevel.Information);
  }

  public logError(error: any, severityLevel?: SeverityLevel): void {
    if (this.matomoEnabled) {
      this.logEvent(LoggingEventCategory.error, LoggingEvent.error, {
        error,
        severityLevel,
      });
    }

    this.displayOnConsole(error, severityLevel);
  }

  public logEvent(
    category: LoggingEventCategory | string,
    action: LoggingEvent | string,
    properties?: { [key: string]: any },
  ): void {
    if (this.matomoEnabled) {
      window._paq.push([
        'trackEvent',
        category,
        action,
        properties.name ? properties.name : null,
        properties.value ? properties.value : null,
      ]);
    }
    if (this.appInsightsEnabled) {
      properties.category = category;
      properties.action = action;
      this.appInsights.trackEvent({ name: `referral-${action}` }, properties);
    }
    this.displayOnConsole(
      `logEvent: ${category} - ${action} - properties: ${JSON.stringify(
        properties,
      )}`,
      SeverityLevel.Information,
    );
  }

  public logException(exception: Error, severityLevel?: SeverityLevel): void {
    if (this.matomoEnabled) {
      this.logEvent(LoggingEventCategory.error, LoggingEvent.exception, {
        exception,
        severityLevel,
      });
    }
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

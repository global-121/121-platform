import { inject, Injectable, isDevMode } from '@angular/core';

import { parseMatomoConnectionString } from '_matomo.utils.mjs';
import { MatomoTracker, provideMatomo, withRouter } from 'ngx-matomo-client';

import { AppRoutes } from '~/app.routes';
import { PrivacyCopyNoTrackingComponent } from '~/components/privacy/privacy-copy-no-tracking.component';
import { PrivacyCopyTrackingComponent } from '~/components/privacy/privacy-copy-tracking.component';
import { environment } from '~environment';

/**
 * Matomo tracking Category-names.
 *
 * These are used to group events in "user goal focused"-groups.
 *
 * Naming convention:
 * For the keys:
 * - Follow the "camelCase" code-conventions
 * - Use singular nouns...
 *
 * For the values:
 * - Use "Title Case" (i.e. "Export")
 * - Use "human readable" values (but be concise.)
 *
 */
export enum TrackingCategory {
  export = 'Export',
  manageRegistrations = 'Manage Registrations',
}

/**
 * Matomo tracking Action-names.
 *
 * These are used to describe the action that was performed.
 *
 * Naming convention:
 * - Use am active verb prefix; i.e. "submit", "click", "open", "select", etc.
 * - Use "human readable" values (but be concise.)
 */
export enum TrackingAction {
  clickBulkActionButton = 'click: Bulk Action Button',
  clickContextMenuOption = 'click: Context-menu Option',
  clickProceedButton = 'click: Proceed Button',
  selectDropdownOption = 'select: Dropdown Option',
}

/**
 * Matomo tracking Event.
 *
 * Contains the information that is sent to the Matomo API.
 *
 */
export interface TrackingEvent {
  category: TrackingCategory;
  action: TrackingAction;
  name?: string; // Optional, but recommended
  value?: number; // Optional, but recommended
}

const MATOMO_CONNECTION_INFO = parseMatomoConnectionString(
  environment.matomo_connection_string,
);

const IS_MATOMO_ENABLED = () =>
  MATOMO_CONNECTION_INFO.id &&
  MATOMO_CONNECTION_INFO.api &&
  MATOMO_CONNECTION_INFO.sdk;

@Injectable({
  providedIn: 'root',
})
export class TrackingService {
  public static APP_PROVIDERS = IS_MATOMO_ENABLED()
    ? [
        provideMatomo(
          {
            siteId: MATOMO_CONNECTION_INFO.id,
            trackerUrl: MATOMO_CONNECTION_INFO.api,
            trackerUrlSuffix: '', // Should be included in `connectionInfo.api` used as `trackerUrl`
            scriptUrl: MATOMO_CONNECTION_INFO.sdk,
            acceptDoNotTrack: true, // Prevent unnecessary requests to the Matomo API
            requireConsent: 'none', // Will change with AB#33767
            runOutsideAngularZone: true,
            enableJSErrorTracking: false, // We use ApplicationInsights for this
            enableLinkTracking: 'enable-pseudo', // Enable tracking of right/middle-clicks
            trackAppInitialLoad: false,
          },
          withRouter({
            exclude: [new RegExp(AppRoutes.authCallback)],
          }),
        ),
      ]
    : [];

  private readonly tracker = IS_MATOMO_ENABLED()
    ? inject(MatomoTracker)
    : undefined;

  public get PrivacyCopyComponent() {
    return IS_MATOMO_ENABLED()
      ? PrivacyCopyTrackingComponent
      : PrivacyCopyNoTrackingComponent;
  }

  /**
   *
   * @example Using only the `name`-property
   * ```ts
   * this.trackingService.trackEvent({
   *   category: TrackingCategory.export,
   *   action: TrackingAction.clickMenuOption,
   *   name: 'Export to PDF',
   * });
   * ```
   * @example Using a numeric value for the `value`-property
   * ```ts
   * this.trackingService.trackEvent({
   *  category: TrackingCategory.filterRegistrations,
   *  action: TrackingAction.inputFreeText,
   *  name: 'Nr. of Results',
   *  value: apiResponse.results.length,
   * });
   * ```
   *
   */
  public trackEvent(event: TrackingEvent): void {
    if (!environment.production || isDevMode()) {
      console.info('TrackingEvent:', event);
    }

    const { category, action, name, value } = event;
    this.tracker?.trackEvent(category, action, name, value);
  }
}

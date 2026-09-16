import {
  TrackingAction,
  TrackingCategory,
} from '~/services/tracking/tracking.enums';

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

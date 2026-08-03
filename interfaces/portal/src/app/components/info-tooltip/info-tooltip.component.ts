import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
} from '@angular/core';

import { TooltipModule } from 'primeng/tooltip';

import { RtlHelperService } from '~/services/rtl-helper.service';
import {
  TrackingAction,
  TrackingCategory,
  TrackingService,
} from '~/services/tracking.service';

const TRACK_EVENT_DELAY_MS = 1000;

@Component({
  selector: 'app-info-tooltip',
  imports: [TooltipModule],
  templateUrl: './info-tooltip.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoTooltipComponent {
  readonly rtlHelper = inject(RtlHelperService);
  readonly message = input.required<string>();

  private trackingService = inject(TrackingService);

  private trackEventTimeout: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.cancelTrackEvent();
    });
  }

  private scheduleTrackEvent(): void {
    this.cancelTrackEvent();
    this.trackEventTimeout = setTimeout(() => {
      this.trackEvent();
    }, TRACK_EVENT_DELAY_MS);
  }

  private cancelTrackEvent(): void {
    if (this.trackEventTimeout !== undefined) {
      clearTimeout(this.trackEventTimeout);
      this.trackEventTimeout = undefined;
    }
  }

  private trackEvent(): void {
    this.trackingService.trackEvent({
      category: TrackingCategory.additionalInformationViewed,
      action: TrackingAction.hoverInformationIcon,
      name: this.message(),
    });
  }

  handleMouseOver(event: Event): void {
    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    this.scheduleTrackEvent();
  }

  handleMouseOut(event: Event): void {
    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    this.cancelTrackEvent();
  }

  handleEnterKey(event: Event): void {
    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    target.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    this.scheduleTrackEvent();
  }

  handleFocusOut(event: FocusEvent): void {
    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    target.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    this.cancelTrackEvent();
  }
}

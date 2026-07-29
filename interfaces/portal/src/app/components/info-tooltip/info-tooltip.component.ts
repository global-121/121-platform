import {
  ChangeDetectionStrategy,
  Component,
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

  trackEvent(): void {
    this.trackingService.trackEvent({
      category: TrackingCategory.additionalInformationViewed,
      action: TrackingAction.hoverInformationIcon,
      name: this.message(),
    });
  }

  handleEnterKey(event: Event): void {
    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    target.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    this.trackEvent();
  }

  handleFocusOut(event: FocusEvent): void {
    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    target.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
  }
}

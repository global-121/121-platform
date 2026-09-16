import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  model,
} from '@angular/core';

import {
  ExplainerTrackingName,
  TrackingAction,
  TrackingCategory,
} from '~/services/tracking.enum';
import { TrackingService } from '~/services/tracking.service';

export interface ExplainerItem {
  content: string;
  image?: { url: string; alt: string; maxWidth?: string };
}

@Component({
  selector: 'app-explainer',
  templateUrl: './explainer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExplainerComponent {
  readonly title = input.required<string>();
  readonly items = input.required<ExplainerItem[]>();
  readonly trackingEventName = input.required<ExplainerTrackingName>();

  readonly expanded = model<boolean>(false);
  readonly trackingService = inject(TrackingService);

  constructor() {
    effect(() => {
      const isExpanded = this.expanded();
      if (isExpanded) {
        this.trackingService.trackEvent({
          category: TrackingCategory.additionalInformationViewed,
          action: TrackingAction.clickOpenExplainer,
          name: this.trackingEventName(),
        });
      }
    });
  }
}

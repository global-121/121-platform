import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  model,
} from '@angular/core';

import {
  Accordion,
  AccordionContent,
  AccordionHeader,
  AccordionPanel,
} from 'primeng/accordion';

import {
  TrackingAction,
  TrackingCategory,
  TrackingService,
} from '~/services/tracking.service';

export interface ExplainerItem {
  content: string;
  image?: { url: string; alt: string; maxWidth?: string };
}
@Component({
  selector: 'app-explainer',
  imports: [Accordion, AccordionPanel, AccordionHeader, AccordionContent],
  templateUrl: './explainer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExplainerComponent {
  readonly title = input.required<string>();
  readonly items = input.required<ExplainerItem[]>();
  readonly trackingEventAction = input.required<string>();

  readonly expanded = model<boolean>(false);

  readonly trackingService = inject(TrackingService);

  constructor() {
    effect(() => {
      const isExpanded = this.expanded();
      if (isExpanded) {
        this.trackingService.trackEvent({
          category: TrackingCategory.additionalInformationViewed,
          action: TrackingAction.explainerOpened,
          name: this.trackingEventAction(),
        });
      }
    });
  }
}

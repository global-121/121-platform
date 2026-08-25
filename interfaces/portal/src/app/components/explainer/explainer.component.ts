import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import {
  Accordion,
  AccordionContent,
  AccordionHeader,
  AccordionPanel,
} from 'primeng/accordion';

@Component({
  selector: 'app-explainer',
  imports: [Accordion, AccordionPanel, AccordionHeader, AccordionContent],
  templateUrl: './explainer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExplainerComponent {
  readonly title = input.required<string>();
  readonly items = input.required<{ content: string; imageUrl?: string }[]>();
}

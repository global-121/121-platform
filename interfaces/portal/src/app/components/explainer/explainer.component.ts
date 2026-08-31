import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import {
  Accordion,
  AccordionContent,
  AccordionHeader,
  AccordionPanel,
} from 'primeng/accordion';

interface ExplainerItem {
  content: string;
  image?: { url: string; alt: string };
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
}

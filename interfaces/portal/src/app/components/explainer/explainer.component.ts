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

/* 
HOW TO USE:
In the parent component, define the explainerProps object with title and items:

<app-explainer
  [title]="explainerProps.title"
  [items]="explainerProps.items"
/>

explainerProps = {
  title: $localize`Where do I find this?`,
  items: [
    {
      content: $localize`Open your form in kobo, then click 'summary' in the top tab bar`,
      imageUrl: '/assets/explainer-images/kobo-where-do-I-find-this-1.png',
    },
    ..etc
  ],
};
*/
export class ExplainerComponent {
  readonly title = input<string>();
  readonly items = input<{ content: string; imageUrl?: string }[]>();
}

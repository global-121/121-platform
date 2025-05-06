import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

import { CardModule } from 'primeng/card';

import { SkeletonInlineComponent } from '~/components/skeleton-inline/skeleton-inline.component';

@Component({
  selector: 'app-card-with-button',
  imports: [CardModule, SkeletonInlineComponent],
  templateUrl: './card-with-button.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardWithButtonComponent {
  readonly title = input.required<string>();
  readonly loading = input<boolean>(false);
  readonly cardClicked = output();
}

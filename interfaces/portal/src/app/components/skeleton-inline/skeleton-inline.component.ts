import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

import { SkeletonModule } from 'primeng/skeleton';

import { getRandomInt } from '@121-service/src/utils/random-value.helper';

@Component({
  selector: 'app-skeleton-inline',
  imports: [SkeletonModule],
  templateUrl: './skeleton-inline.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonInlineComponent {
  readonly width = input<string>();
  readonly skeletonWidth = computed(
    () => this.width() ?? `${getRandomInt(42, 98).toString()}%`,
  );
}

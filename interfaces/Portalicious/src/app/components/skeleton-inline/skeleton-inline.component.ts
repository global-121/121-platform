import { getRandomInt } from '@121-service/src/utils/getRandomValue.helper';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-skeleton-inline',
  standalone: true,
  imports: [SkeletonModule],
  templateUrl: './skeleton-inline.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonInlineComponent {
  width = input<string>();
  skeletonWidth = computed(
    () => this.width() ?? `${getRandomInt(42, 98).toString()}%`,
  );
}

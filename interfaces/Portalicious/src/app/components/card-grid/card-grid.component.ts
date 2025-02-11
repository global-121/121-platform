import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-card-grid',
  imports: [SkeletonModule, CardModule],
  templateUrl: './card-grid.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardGridComponent {
  readonly empty = input.required<boolean>();
  readonly emptyTitle = input.required<string>();
  readonly emptySubtitle = input.required<string>();
  readonly loading = input<boolean>();
}

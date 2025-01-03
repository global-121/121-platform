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
  empty = input.required<boolean>();
  emptyTitle = input.required<string>();
  emptySubtitle = input.required<string>();
  loading = input<boolean>();
}

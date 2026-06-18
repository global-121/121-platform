import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-card-grid',
  imports: [SkeletonModule, CardModule],
  templateUrl: './card-grid.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardGridComponent {
  readonly loading = input<boolean>();
}

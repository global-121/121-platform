import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-card-grid',
  imports: [SkeletonModule],
  templateUrl: './card-grid.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardGridComponent {
  readonly loading = input<boolean>();
}

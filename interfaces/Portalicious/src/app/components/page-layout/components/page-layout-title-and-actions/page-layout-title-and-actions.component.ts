import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-page-layout-title-and-actions',
  standalone: true,
  imports: [SkeletonModule],
  templateUrl: './page-layout-title-and-actions.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageLayoutTitleAndActionsComponent {
  isPending = input<boolean>();
}

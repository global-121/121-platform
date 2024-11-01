import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { SkeletonInlineComponent } from '~/components/skeleton-inline/skeleton-inline.component';

@Component({
  selector: 'app-metric-container',
  standalone: true,
  imports: [SkeletonInlineComponent],
  templateUrl: './metric-container.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetricContainerComponent {
  public pending = input.required<boolean>();
  public value = input<null | number | string>();
  public label = input.required<string>();
  public showAlert = input<boolean>(false);
}

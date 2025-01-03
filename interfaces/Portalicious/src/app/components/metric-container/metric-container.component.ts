import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { SkeletonInlineComponent } from '~/components/skeleton-inline/skeleton-inline.component';
import { SummaryMetric } from '~/domains/metric/metric.model';

@Component({
  selector: 'app-metric-container',
  imports: [SkeletonInlineComponent],
  templateUrl: './metric-container.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetricContainerComponent {
  public metric = input.required<SummaryMetric>();
}

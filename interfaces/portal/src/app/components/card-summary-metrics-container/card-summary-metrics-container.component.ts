import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { MetricContainerComponent } from '~/components/metric-container/metric-container.component';
import { SummaryMetric } from '~/domains/metric/metric.model';

@Component({
  selector: 'app-card-summary-metrics-container',
  imports: [MetricContainerComponent],
  templateUrl: './card-summary-metrics-container.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardSummaryMetricsContainerComponent {
  public readonly summaryMetrics = input.required<SummaryMetric[]>();
}

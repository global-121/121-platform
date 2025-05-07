import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';

import {
  ChipVariant,
  ColoredChipComponent,
} from '~/components/colored-chip/colored-chip.component';
import { InfoTooltipComponent } from '~/components/info-tooltip/info-tooltip.component';
import { SkeletonInlineComponent } from '~/components/skeleton-inline/skeleton-inline.component';

@Component({
  selector: 'app-metric-tile',
  imports: [
    CardModule,
    ColoredChipComponent,
    TooltipModule,
    SkeletonInlineComponent,
    InfoTooltipComponent,
  ],
  templateUrl: './metric-tile.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetricTileComponent {
  readonly pending = input.required<boolean>();

  readonly metricLabel = input.required<string>();
  readonly metricValue = input<null | number | string>();
  readonly metricTooltip = input<string>();

  readonly chipVariant = input<ChipVariant>();
  readonly chipLabel = input<string>();
  readonly chipIcon = input<string>();
  readonly chipTooltip = input<string>();
}

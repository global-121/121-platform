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
  standalone: true,
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
  pending = input.required<boolean>();

  metricLabel = input.required<string>();
  metricValue = input<null | number | string>();
  metricTooltip = input<string>();

  chipVariant = input<ChipVariant>();
  chipLabel = input<string>();
  chipIcon = input<string>();
  chipTooltip = input<string>();
}

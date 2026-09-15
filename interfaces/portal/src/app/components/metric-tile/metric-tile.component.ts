import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';

import { ColoredChipComponent } from '~/components/colored-chip/colored-chip.component';
import {
  InfoTooltipComponent,
  InfoTooltipData,
} from '~/components/info-tooltip/info-tooltip.component';
import { SkeletonInlineComponent } from '~/components/skeleton-inline/skeleton-inline.component';
import { ColorVariant } from '~/utils/color-variant.enum';

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
  readonly metricTooltipData = input<InfoTooltipData>();

  readonly chipVariant = input<ColorVariant>();
  readonly chipLabel = input<string>();
  readonly chipIcon = input<string>();

  /*
   Because we use primeNg's p-chip component that takes a tooltip input,
   I unfortunatly cannot add a trackingEventName because the tooltip is
   handled internally by the p-chip component (and takes only a <string>).
  */
  readonly chipTooltip = input<string>();
}

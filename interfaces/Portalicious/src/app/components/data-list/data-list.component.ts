import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  ChipVariant,
  ColoredChipComponent,
} from '~/components/colored-chip/colored-chip.component';
import { InfoTooltipComponent } from '~/components/info-tooltip/info-tooltip.component';
import { SkeletonInlineComponent } from '~/components/skeleton-inline/skeleton-inline.component';

export type DataListItem = {
  label: string;
  tooltip?: string;
  loading?: boolean;
  chipLabel?: string;
  chipVariant?: ChipVariant;
} & (
  | {
      type: 'currency';
      value?: null | number | string;
      currencyCode?: null | string;
      currencyFormat?: string;
    }
  | {
      type: 'number';
      value?: null | number;
    }
  | {
      type?: 'date' | 'text';
      value?: Date | null | number | string;
    }
);

@Component({
  selector: 'app-data-list',
  standalone: true,
  imports: [
    InfoTooltipComponent,
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    SkeletonInlineComponent,
    ColoredChipComponent,
  ],
  templateUrl: './data-list.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataListComponent {
  data = input.required<DataListItem[]>();
}

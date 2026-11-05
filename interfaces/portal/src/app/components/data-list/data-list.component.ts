import { NgClass, NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

import { determineDataListItemEdgeFlags } from '~/components/data-list/data-list-edge-flags.helper';
import { DataListItem } from '~/components/data-list/data-list-item.type';
import { DataListValueComponent } from '~/components/data-list/data-list-value/data-list-value.component';
import { InfoTooltipComponent } from '~/components/info-tooltip/info-tooltip.component';
import { TranslatableStringPipe } from '~/pipes/translatable-string.pipe';

@Component({
  selector: 'app-data-list',
  imports: [
    TranslatableStringPipe,
    DataListValueComponent,
    InfoTooltipComponent,
    NgComponentOutlet,
    NgTemplateOutlet,
    NgClass,
  ],
  templateUrl: './data-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataListComponent {
  readonly data = input.required<DataListItem[]>();
  readonly forceOneColumn = input(false);
  readonly horizontal = input(false);

  readonly itemEdgeFlags = computed(() =>
    determineDataListItemEdgeFlags({
      items: this.data(),
      forceOneColumn: this.forceOneColumn(),
    }),
  );
}

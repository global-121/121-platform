import {
  CurrencyPipe,
  DatePipe,
  DecimalPipe,
  NgClass,
  NgComponentOutlet,
} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';

import { getRandomInt } from '@121-service/src/utils/random-value.helper';

import { ColoredChipComponent } from '~/components/colored-chip/colored-chip.component';
import { DataListItem } from '~/components/data-list/data-list-item.type';
import { TranslatableStringPipe } from '~/pipes/translatable-string.pipe';
import { TranslatableStringService } from '~/services/translatable-string.service';
import { ColorVariant } from '~/utils/color-variant.enum';
import { debugLog, LOCAL_STORAGE_DEBUG_DATA_LIST_KEY } from '~/utils/debug-log';

@Component({
  selector: 'app-data-list-value',
  imports: [
    ColoredChipComponent,
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    NgClass,
    NgComponentOutlet,
    RouterLink,
    SkeletonModule,
    TagModule,
    TranslatableStringPipe,
  ],
  templateUrl: './data-list-value.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataListValueComponent {
  readonly item = input.required<DataListItem>();

  readonly skeletonWidth = `${getRandomInt(42, 98).toString()}%`;

  private skeletonShownAt?: number;

  private readonly translatableStringService = inject(
    TranslatableStringService,
  );

  constructor() {
    effect(() => {
      this.logSkeletonVisibility({ item: this.item() });
    });
  }

  private logSkeletonVisibility({ item }: { item: DataListItem }): void {
    if (item.loading && this.skeletonShownAt === undefined) {
      this.skeletonShownAt = performance.now();
      debugLog({
        localStorageKey: LOCAL_STORAGE_DEBUG_DATA_LIST_KEY,
        message: 'Skeleton shown',
        details: { label: item.label },
      });
      return;
    }

    if (!item.loading && this.skeletonShownAt !== undefined) {
      debugLog({
        localStorageKey: LOCAL_STORAGE_DEBUG_DATA_LIST_KEY,
        message: 'Skeleton hidden',
        details: {
          label: item.label,
          visibleForMilliseconds: Math.round(
            performance.now() - this.skeletonShownAt,
          ),
        },
      });
      this.skeletonShownAt = undefined;
    }
  }

  getChipProps({
    item,
  }: {
    item: DataListItem;
  }): { label: string; variant: ColorVariant } | undefined {
    if (item.type === 'koboImage') {
      return this.getKoboImageChipProps({ imageUrl: item.value });
    }

    if (!item.chipLabel || !item.chipVariant) {
      return;
    }

    return { label: item.chipLabel, variant: item.chipVariant };
  }

  private getKoboImageChipProps({ imageUrl }: { imageUrl: string }) {
    const isAvailable = !!imageUrl;

    return {
      label: isAvailable
        ? $localize`:@@image-available:Available`
        : $localize`:@@image-not-available:Not available`,
      variant: isAvailable ? ColorVariant.Green : ColorVariant.Red,
    };
  }

  hasValue({ value }: { value: unknown }): boolean {
    if (value === undefined || value === null) {
      return false;
    }

    if (typeof value === 'string') {
      return value.trim() !== '';
    }

    return true;
  }

  optionItemValue(item: { type: 'options' } & DataListItem) {
    const value = Array.isArray(item.value) ? item.value : [item.value];

    const valueList = value.map((v) => {
      const option = item.options?.find((o) => o.value === v);

      return this.translatableStringService.translate(option?.label) ?? v;
    });

    return this.translatableStringService.commaSeparatedList({
      values: valueList,
    });
  }
}

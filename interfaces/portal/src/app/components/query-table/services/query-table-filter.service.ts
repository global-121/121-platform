import { computed, inject, signal } from '@angular/core';

import { FilterMatchMode, FilterMetadata } from 'primeng/api';
import { ColumnFilter } from 'primeng/table';

import {
  QueryTableColumn,
  QueryTableColumnType,
} from '~/components/query-table/query-table.component';
import { QueryTableCellService } from '~/components/query-table/services/query-table-cell.service';
import {
  TrackingAction,
  TrackingCategory,
  TrackingService,
} from '~/services/tracking.service';

export class QueryTableFilterService<TData> {
  private readonly trackingService = inject(TrackingService);
  private readonly cellService = inject(QueryTableCellService);

  readonly tableFilters = signal<
    Record<string, FilterMetadata | FilterMetadata[] | undefined>
  >({});
  readonly globalFilterVisible = signal<boolean>(false);

  readonly globalFilterValue = computed(() => {
    const tableFilters = this.tableFilters();

    const globalFilter = Array.isArray(tableFilters.global)
      ? tableFilters.global[0]
      : tableFilters.global;
    if (
      globalFilter &&
      typeof globalFilter.value === 'string' &&
      globalFilter.value !== ''
    ) {
      // without this, the global filter value is not restored properly from local storage
      return globalFilter.value;
    }

    return undefined;
  });

  readonly isFiltered = computed(() => {
    if (this.globalFilterValue()) {
      return true;
    }

    // check if any filter is set by checking if any filter has a value
    return Object.values(this.tableFilters()).some((filterMetadata) => {
      if (!filterMetadata) {
        return false;
      }

      const filterMetadataArray: FilterMetadata[] = Array.isArray(
        filterMetadata,
      )
        ? filterMetadata
        : [filterMetadata];
      return filterMetadataArray.some(
        (filter) => filter.value !== undefined && filter.value !== null,
      );
    });
  });

  getColumnFilterField(column: QueryTableColumn<TData>) {
    if (column.disableFiltering || column.field === 'COMPUTED_FIELD') {
      // filtering is disabled for computed fields
      return undefined;
    }
    return column.fieldForFilter ?? column.field;
  }

  getIsColumnFiltered(column: QueryTableColumn<TData>): boolean {
    const field = this.getColumnFilterField(column);
    if (!field) {
      return false;
    }
    const tableFilter = this.tableFilters()[field];
    const tableFilterMetadata = Array.isArray(tableFilter)
      ? tableFilter[0]
      : tableFilter;

    return !!tableFilterMetadata?.value;
  }

  getColumnMatchMode(column: QueryTableColumn<TData>): FilterMatchMode {
    const type = this.cellService.getColumnType(column);
    switch (type) {
      case QueryTableColumnType.MULTISELECT:
        return FilterMatchMode.IN;
      case QueryTableColumnType.DATE:
      case QueryTableColumnType.NUMERIC:
        return FilterMatchMode.EQUALS;
      case QueryTableColumnType.TEXT:
      default:
        return FilterMatchMode.CONTAINS;
    }
  }

  getColumnMatchModeOptions(
    column: QueryTableColumn<TData>,
  ): { label: string; value: FilterMatchMode }[] | undefined {
    const type = this.cellService.getColumnType(column);
    switch (type) {
      case QueryTableColumnType.NUMERIC:
        return [
          { label: $localize`Equal to`, value: FilterMatchMode.EQUALS },
          { label: $localize`Not equal to`, value: FilterMatchMode.NOT_EQUALS },
          { label: $localize`Less than`, value: FilterMatchMode.LESS_THAN },
          {
            label: $localize`Greater than`,
            value: FilterMatchMode.GREATER_THAN,
          },
        ];
      case QueryTableColumnType.DATE:
        return [
          { label: $localize`Date is`, value: FilterMatchMode.EQUALS },
          {
            label: $localize`Date is before`,
            value: FilterMatchMode.LESS_THAN,
          },
          {
            label: $localize`Date is after`,
            value: FilterMatchMode.GREATER_THAN,
          },
        ];
      case QueryTableColumnType.MULTISELECT:
        // For multiselect, we do not have multiple match modes
        return undefined;
      case QueryTableColumnType.TEXT:
      default:
        return [
          { label: $localize`Contains`, value: FilterMatchMode.CONTAINS },
          { label: $localize`Equal to`, value: FilterMatchMode.EQUALS },
          { label: $localize`Not equal to`, value: FilterMatchMode.NOT_EQUALS },
        ];
    }
  }

  onShowColumnFilter(name: string, type: QueryTableColumnType) {
    this.trackingService.trackEvent({
      category: TrackingCategory.manageTableSettings,
      action: TrackingAction.showColumnFilter,
      name: `type:${type} name:${name}`,
    });
  }

  clearColumnFilter(event: MouseEvent, columnFilter: ColumnFilter) {
    event.stopPropagation();
    columnFilter.clearFilter();

    this.trackingService.trackEvent({
      category: TrackingCategory.manageTableSettings,
      action: TrackingAction.clickClearColumnFilterButton,
      name: `type:${columnFilter.type} name:${columnFilter.field ?? 'unknown'}`,
    });
  }

  clearAllFilters(options: {
    clearTable: () => void;
    localStorageKey: string | undefined;
    resetSelection: () => void;
  }) {
    options.clearTable();
    if (options.localStorageKey) {
      localStorage.removeItem(options.localStorageKey);
    }
    this.globalFilterVisible.set(false);
    this.tableFilters.set({});
    options.resetSelection();

    this.trackingService.trackEvent({
      category: TrackingCategory.manageTableSettings,
      action: TrackingAction.clickClearAllFiltersButton,
    });
  }

  updateTableFilters(
    filters: Record<string, FilterMetadata | FilterMetadata[] | undefined>,
  ) {
    this.tableFilters.set({
      // Clone to make sure to trigger change detection. See: https://stackoverflow.com/a/77532370
      ...filters,
    });
  }
}

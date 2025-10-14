import { computed, inject, signal } from '@angular/core';
import { TableLazyLoadEvent } from 'primeng/table';

import {
  PaginateQuery,
  PaginateQueryService,
} from '~/services/paginate-query.service';

export class QueryTablePaginationService<TData> {
  private readonly paginateQueryService = inject(PaginateQueryService);

  readonly serverSideTotalRecords = signal<number | undefined>(undefined);

  readonly totalRecords = computed(() => (
    items: TData[],
    serverSideFiltering: boolean,
  ) => {
    if (!serverSideFiltering) {
      return items.length;
    }

    const totalRecords = this.serverSideTotalRecords();

    if (totalRecords === undefined) {
      throw new Error('Server side filtering requires totalRecords to be set');
    }

    return totalRecords;
  });

  readonly currentPageReportTemplate = computed(() => (selectedItemsCount?: number) => {
    const baseTemplate =
      $localize`:The contents of the square brackets should not be touched/changed:Showing [first] to [last] of [totalRecords] records`
        // this is a workaround because the i18n compiler does not support curly braces in the template
        .replaceAll('[', '{')
        .replaceAll(']', '}');

    if (!selectedItemsCount) {
      return baseTemplate;
    }

    return (
      baseTemplate +
      ' ' +
      $localize`(${selectedItemsCount.toString()} selected)`
    );
  });

  onLazyLoadEvent(
    event: TableLazyLoadEvent,
    onUpdate: (query: PaginateQuery) => void,
  ) {
    const paginateQuery =
      this.paginateQueryService.convertPrimeNGLazyLoadEventToPaginateQuery(
        event,
      );
    if (!paginateQuery) {
      return;
    }
    onUpdate(paginateQuery);
  }
}
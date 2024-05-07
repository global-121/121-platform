import { Injectable } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  FilterOperator,
  FilterParameter,
  SortDirection,
} from '../enums/filters.enum';
import RegistrationStatus from '../enums/registration-status.enum';

export class Filter {
  name: string;
  label: string;
  allowedOperators?: FilterOperator[];
  isInteger?: boolean;
}
export class PaginationFilter extends Filter {
  value: string;
  operator?: FilterOperator;
}

export class PaginationSort {
  column: string;
  direction: SortDirection;
}

@Injectable({
  providedIn: 'root',
})
export class FilterService {
  public DIVIDER_FILTER_OPTION = {
    name: 'divider',
    label: '-',
    disabled: true,
  };

  public SEARCH_FILTER_OPTION: Filter = {
    name: FilterParameter.search,
    label: '',
    allowedOperators: [],
  };

  private DEFAULT_TEXT_FILTER = [];
  private allAvailableFilters: Filter[] = [];

  private textFilter: Map<PaginationFilter['name'], PaginationFilter>;
  private textFilterSubject = new BehaviorSubject<PaginationFilter[]>(
    this.DEFAULT_TEXT_FILTER,
  );
  public textFilter$: Observable<PaginationFilter[]> =
    this.textFilterSubject.asObservable();

  private statusFilter: RegistrationStatus[];
  private statusFilterSubject = new BehaviorSubject<RegistrationStatus[]>([]);
  public statusFilter$: Observable<RegistrationStatus[]> =
    this.statusFilterSubject.asObservable();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private translate: TranslateService,
  ) {
    this.resetTextFilterInternal();

    this.route.queryParams.subscribe((params) => {
      if (!params) {
        this.resetTextFilterInternal();
        return;
      }
      if (!this.allAvailableFilters.length) {
        return;
      }

      this.updateFiltersFromUrl(params);
    });
  }

  private resetTextFilterInternal() {
    this.SEARCH_FILTER_OPTION.label = this.translate.instant(
      'page.program.table-filter-row.filter-quick-search',
    );

    this.textFilter = new Map(this.DEFAULT_TEXT_FILTER);
  }

  private publishTextFilter() {
    this.textFilterSubject.next(Array.from(this.textFilter.values()));
  }

  private updateUrl(property: string, value: string | null) {
    this.router.navigate([], {
      queryParams: {
        [property]: value,
      },
      queryParamsHandling: 'merge',
      preserveFragment: true,
    });
  }

  private updateFiltersFromUrl(params: Params) {
    this.resetTextFilterInternal();

    Object.keys(params).forEach((key) => {
      if (!this.isAvailableFilter(key)) {
        return;
      }

      const filterValueRaw = params[key];
      const filterValue = this.sanitizeFilterValue(filterValueRaw);

      if (!filterValue) {
        this.removeTextFilter(key, false);
        return;
      }
      const allowedOperators = this.getFilterOperatorForName(key);
      this.setTextFilter(key, filterValue, allowedOperators, null, false);
    });

    this.publishTextFilter();
  }

  private getFilterOperatorForName(name: string): FilterOperator[] {
    const filter = this.allAvailableFilters.find(
      (filter) => filter.name === name,
    );
    return filter.allowedOperators;
  }

  private isAvailableFilter(name: string) {
    return (
      this.allAvailableFilters.findIndex((filter) => filter.name === name) > -1
    );
  }

  public setAllAvailableFilters(filters: Filter[]) {
    if (!filters) {
      return;
    }
    this.allAvailableFilters = filters;

    this.updateFiltersFromUrl(this.route.snapshot.queryParams);
  }

  private getLabelOfFilter(filterName: PaginationFilter['name']): string {
    const filter = this.allAvailableFilters.find(
      (filter) => filter.name === filterName,
    );
    return filter && filter.label ? filter.label : '';
  }

  public setTextFilter(
    columnName: string,
    value: string,
    allowedOperations: FilterOperator[],
    label?: string,
    publishChange = true,
  ) {
    if (!label) {
      label = this.getLabelOfFilter(columnName);
    }

    this.textFilter.set(columnName, {
      name: columnName,
      label,
      value,
      operator: allowedOperations.includes(FilterOperator.ilike)
        ? FilterOperator.ilike
        : FilterOperator.eq,
    });

    if (publishChange) {
      this.updateUrl(columnName, value);
      this.publishTextFilter();
    }
  }

  public removeTextFilter(columnName: string, publishChange = true) {
    this.textFilter.delete(columnName);

    if (publishChange) {
      this.updateUrl(columnName, null);
      this.publishTextFilter();
    }
  }

  public clearAllFilters() {
    const filtersToClear = Array.from(this.textFilter.keys());

    const clearedQueryParams = {};
    filtersToClear.forEach((filterName: string) => {
      clearedQueryParams[filterName] = null;
    });

    this.router.navigate([], {
      queryParams: clearedQueryParams,
      queryParamsHandling: 'merge',
      preserveFragment: true,
    });

    this.resetTextFilterInternal();
    this.textFilterSubject.next(this.DEFAULT_TEXT_FILTER);
  }

  public sanitizeFilterValue(value: string): string {
    if (!value) {
      return '';
    }

    const forbiddenCharacters = [',', '&', '$', ':'];
    forbiddenCharacters.forEach((character) => {
      value = value.replaceAll(character, '');
    });
    return value.trim();
  }

  /* *******************************************************

    Status Filter

   ********************************************************* */
  public updateStatusFilter(filter: RegistrationStatus[]) {
    this.statusFilter = filter;
    this.statusFilterSubject.next(this.statusFilter);
  }
}

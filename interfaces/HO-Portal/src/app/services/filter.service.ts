import { Injectable } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import RegistrationStatus from '../enums/registration-status.enum';

export class Filter {
  name: string;
  label: string;
}
export class PaginationFilter extends Filter {
  value: string;
  operator?: FilterOperatorEnum;
}

export class PaginationSort {
  column: string;
  direction: SortDirectionEnum;
}

export enum SortDirectionEnum {
  ASC = 'ASC',
  DESC = 'DESC',
}

export enum FilterOperatorEnum {
  eq = '$eq',
  in = '$in',
  ilike = '$ilike',
  null = '$null',
}

@Injectable({
  providedIn: 'root',
})
export class FilterService {
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
  ) {
    this.resetTextFilterInternal();

    this.route.queryParams.subscribe((params) => {
      console.log('FilterService Params - subscription: ', params);
      if (!params) {
        this.resetTextFilterInternal();
        return;
      }
      if (!this.allAvailableFilters.length) {
        return;
      }

      console.log(
        'FilterService Params - subscription - updateFiltersFromUrl() ',
      );
      this.updateFiltersFromUrl(params);
    });
  }

  private resetTextFilterInternal() {
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
        console.log('updateFiltersFromUrl - IGNORED: ', key);
        return;
      }

      const filterValueRaw = params[key];
      const filterValue = this.sanitizeFilterValue(filterValueRaw);

      if (!filterValue) {
        console.log('updateFiltersFromUrl - Remove: ', key);
        this.removeTextFilter(key, false);
        return;
      }

      console.log('updateFiltersFromUrl - Set: ', key);
      this.setTextFilter(key, filterValue, null, false);
    });

    console.log(
      'publishTextFilter in updateFiltersFromUrl (AFTER param-keys loop)',
    );
    this.publishTextFilter();
  }

  private isAvailableFilter(name: string) {
    return (
      this.allAvailableFilters.findIndex((filter) => filter.name === name) > -1
    );
  }

  public setAllAvailableFilters(filters: Filter[]) {
    console.log('FilterService setAllAvailableFilters: ', filters);
    if (!filters) {
      return;
    }
    this.allAvailableFilters = filters;

    console.log('FilterService setAllAvailableFilters - updateFiltersFromUrl');
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
    });

    console.log('setTextFilter - publishChange: ', columnName, publishChange);

    if (publishChange) {
      this.updateUrl(columnName, value);
      this.publishTextFilter();
    }
  }

  public removeTextFilter(columnName: string, publishChange = true) {
    this.textFilter.delete(columnName);

    console.log(
      'removeTextFilter - publishChange: ',
      columnName,
      publishChange,
    );

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

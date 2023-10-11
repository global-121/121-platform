import { Injectable } from '@angular/core';
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

  constructor() {
    this.textFilter = new Map(this.DEFAULT_TEXT_FILTER);
  }

  public setTextFilter(columnName: string, value: string, label: string) {

    this.textFilter.set(columnName, {
      name: columnName,
      label,
      value,
    });

    this.textFilterSubject.next(Array.from(this.textFilter.values()));
  }

  public removeTextFilter(column: string) {
    this.textFilter.delete(column);

    this.textFilterSubject.next(Array.from(this.textFilter.values()));
  }

  public getTextFilterSubscription(): Observable<PaginationFilter[]> {
    return this.textFilterSubject.asObservable();
  }

  public updateStatusFilter(filter: RegistrationStatus[]) {
    this.statusFilter = filter;
    this.statusFilterSubject.next(this.statusFilter);
  }

  public getStatusFilterSubscription(): Observable<RegistrationStatus[]> {
    return this.statusFilterSubject.asObservable();
  }

  public clearAllFilters() {
    const filtersToClear = Array.from(this.textFilter.keys());

    const clearedQueryParams = {};
    filtersToClear.forEach((filterName: string) => {
      clearedQueryParams[filterName] = null;
    });

    this.textFilter = new Map(this.DEFAULT_TEXT_FILTER);
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
}

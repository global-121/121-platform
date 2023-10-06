import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import RegistrationStatus from '../enums/registration-status.enum';

export class PaginationFilter {
  value: string;
  name: string;
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
  private textFilterSubject = new BehaviorSubject<PaginationFilter[]>(
    this.DEFAULT_TEXT_FILTER,
  );
  private textFilter: PaginationFilter[];

  private statusFilterSubject = new BehaviorSubject<RegistrationStatus[]>([]);
  private statusFilter: RegistrationStatus[];

  constructor() {
    this.textFilter = this.DEFAULT_TEXT_FILTER;
  }

  public addTextFilter(column: string, value: string) {
    this.textFilter.push({ name: column, value });
    this.textFilterSubject.next(this.textFilter);
  }

  public removeTextFilter(column: string) {
    this.textFilter = this.textFilter.filter((f) => f.name !== column);
    this.textFilterSubject.next(this.textFilter);
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
}

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export class TableTextFilter {
  column: string;
  value: string;
}

@Injectable({
  providedIn: 'root',
})
export class FilterService {
  private DEFAULT_TEXT_FILTER = [];
  private textFilterSubject = new BehaviorSubject<TableTextFilter[]>(
    this.DEFAULT_TEXT_FILTER,
  );
  private textFilter: TableTextFilter[];

  constructor() {
    this.textFilter = this.DEFAULT_TEXT_FILTER;
  }

  public addTextFilter(column: string, value: string) {
    this.textFilter.push({ column, value });
    this.textFilterSubject.next(this.textFilter);
  }

  public removeTextFilter(column: string) {
    this.textFilter = this.textFilter.filter((f) => f.column !== column);
    this.textFilterSubject.next(this.textFilter);
  }

  public getTextFilterSubscription(): Observable<TableTextFilter[]> {
    return this.textFilterSubject.asObservable();
  }
}

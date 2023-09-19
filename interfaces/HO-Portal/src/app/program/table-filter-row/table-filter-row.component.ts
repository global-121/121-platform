import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { FilterService, TableTextFilter } from '../../services/filter.service';

@Component({
  selector: 'app-table-filter-row',
  templateUrl: './table-filter-row.component.html',
  styleUrls: ['./table-filter-row.component.scss'],
})
export class TableFilterRowComponent implements OnInit {
  @Input()
  public isLoading: boolean;
  @Input()
  public tableFiltersPerColumn: { name: string; label: string }[] = [];

  public textFilterOption: string | undefined;

  public textFilter: Observable<TableTextFilter[]>;

  public filterRowsVisibleQuery: string;

  constructor(private filterService: FilterService) {}
  ngOnInit(): void {
    this.textFilter = this.filterService.getTextFilterSubscription();
  }

  public applyFilter() {
    if (!this.textFilterOption) {
      return;
    }
    if (this.disableApplyButton()) {
      return;
    }
    this.filterService.addTextFilter(
      this.textFilterOption,
      this.filterRowsVisibleQuery,
    );
    this.clearFilter();
  }

  private clearFilter() {
    this.filterRowsVisibleQuery = '';
    this.textFilterOption = undefined;
  }

  public removeTextFilter(column: string) {
    this.filterService.removeTextFilter(column);
  }

  public showInput(): boolean {
    if (!this.textFilterOption) {
      return false;
    }

    return true;
  }

  public disableApplyButton(): boolean {
    if (
      !this.filterRowsVisibleQuery ||
      this.filterRowsVisibleQuery.trim() === ''
    ) {
      return true;
    }

    return false;
  }
}

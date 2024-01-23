import { Component, Input, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import RegistrationStatus from 'src/app/enums/registration-status.enum';
import Permission from '../../auth/permission.enum';
import { StatusTableFilterComponent } from '../../components/status-table-filter/status-table-filter.component';
import { ExportType } from '../../models/export-type.model';
import { ProgramPhase } from '../../models/program.model';
import { TableFilterType } from '../../models/table-filter.model';
import {
  Filter,
  FilterService,
  PaginationFilter,
} from '../../services/filter.service';

@Component({
  selector: 'app-table-filter-row',
  templateUrl: './table-filter-row.component.html',
  styleUrls: ['./table-filter-row.component.scss'],
})
export class TableFilterRowComponent {
  @Input()
  public isLoading: boolean;

  @Input()
  public allFilters: { name: string; label: string }[] = [];

  @Input()
  public thisPhase: ProgramPhase;

  @Input()
  public programId: number;

  @Input()
  public filteredCount: number;

  @Input()
  public showValidation: boolean;

  @ViewChild('statusTableFilter')
  public statusTableFilter: StatusTableFilterComponent;

  public textFilterOption: Filter[] = [];

  public textFilter: Observable<PaginationFilter[]>;

  public filterRowsVisibleQuery: string;

  public tableFilterType = TableFilterType;

  public allPaStatuses = Object.values(RegistrationStatus);

  public enumExportType = ExportType;

  public Permission = Permission;

  constructor(private filterService: FilterService) {
    this.textFilter = this.filterService.textFilter$;
  }

  public initComponent(): void {
    this.statusTableFilter.initComponent();
  }

  public applyFilter() {
    if (!this.textFilterOption.length) {
      return;
    }
    if (this.disableApplyButton()) {
      return;
    }
    this.filterService.setTextFilter(
      this.textFilterOption[0].name,
      this.filterRowsVisibleQuery,
      this.textFilterOption[0].allowedOperators,
      this.textFilterOption[0].label,
    );
    this.clearFilterCreateForm();
  }

  private clearFilterCreateForm() {
    this.filterRowsVisibleQuery = '';
    this.textFilterOption = [];
  }

  public removeTextFilter(column: string) {
    this.filterService.removeTextFilter(column);
  }

  public showInput(): boolean {
    if (!this.textFilterOption.length) {
      return false;
    }

    return true;
  }

  public disableApplyButton(): boolean {
    if (!this.filterService.sanitizeFilterValue(this.filterRowsVisibleQuery)) {
      return true;
    }

    return false;
  }

  public clearAllFilters() {
    this.filterService.clearAllFilters();
  }

  public getFilterInputType() {
    if (this.textFilterOption[0].isInteger) {
      return 'number';
    } else {
      return 'text';
    }
  }

  public handleFilterLabelClick(filter: PaginationFilter): void {
    this.textFilterOption = [
      {
        name: filter.name,
        value: filter.value,
        allowedOperators: filter.allowedOperators || [],
        label: filter.label,
      } as PaginationFilter,
    ];

    this.filterRowsVisibleQuery = filter.value;
  }
}

import { Injectable } from '@angular/core';
import { RegistrationStatusEnum } from '../../../../../services/121-service/src/registration/enum/registration-status.enum';
import {
  FilterOperatorEnum,
  PaginationFilter,
} from '../models/pagination-filter.model';
import { PaginationMetadata } from '../models/pagination-metadata.model';
import { Person } from '../models/person.model';
import { ProgramsServiceApiService } from './programs-service-api.service';

@Injectable({
  providedIn: 'root',
})
export class TableService {
  private textFilter: PaginationFilter;
  private DEFAULT_TEXT_FILTER = { name: null, value: null };

  private pageMetaData = new PaginationMetadata();

  constructor(private programsService: ProgramsServiceApiService) {
    this.resetTextFilter();
  }

  public setTextFilterName(name: string) {
    this.textFilter.name = name;
  }

  public setTextFilterValue(value: string) {
    this.textFilter.value = value;
  }

  public setTextFilterOperator(operator: FilterOperatorEnum) {
    this.textFilter.operator = operator;
  }

  public setCurrentPage(currentPage: number) {
    this.pageMetaData.currentPage = currentPage;
  }

  public setItemsPerPage(itemsPerPage: number) {
    this.pageMetaData.itemsPerPage = itemsPerPage;
  }

  public setTotalItems(totalItems: number) {
    this.pageMetaData.totalItems = totalItems;
  }

  public async getPage(
    programId: string | number,
    referenceId: string = null,
    filterOnPayment: number = null,
    attributes: string[],
    statuses: RegistrationStatusEnum[] = null,
  ): Promise<{ data: Person[]; meta: PaginationMetadata }> {
    if (!programId) {
      return null;
    }

    let filters: PaginationFilter[] = null;

    if (this.textFilter?.name && this.textFilter?.value) {
      filters = [
        {
          name: this.textFilter.name,
          value: this.textFilter.value,
          operator: this.textFilter.operator,
        },
      ];
    }

    const { data, meta } = await this.programsService.getPeopleAffected(
      programId,
      this.pageMetaData.itemsPerPage,
      this.pageMetaData.currentPage + 1,
      referenceId,
      filterOnPayment,
      attributes,
      statuses,
      filters,
    );

    this.pageMetaData.totalItems = meta.totalItems;
    this.pageMetaData.currentPage = meta.currentPage - 1;

    return { data, meta };
  }

  public getPageMetadata(): PaginationMetadata {
    return this.pageMetaData;
  }

  private resetTextFilter() {
    this.textFilter = this.DEFAULT_TEXT_FILTER;
  }
}

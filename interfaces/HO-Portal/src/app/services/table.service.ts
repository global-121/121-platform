import { Injectable } from '@angular/core';
import { RegistrationStatusEnum } from '../../../../../services/121-service/src/registration/enum/registration-status.enum';
import { PaginationMetadata } from '../models/pagination-metadata.model';
import { Person } from '../models/person.model';
import { ProgramsServiceApiService } from './programs-service-api.service';

@Injectable({
  providedIn: 'root',
})
export class TableService {
  private textFilter: {
    column: string;
    value: string;
  };
  private DEFAULT_TEXT_FILTER = { column: null, value: null };

  private pageMetaData = new PaginationMetadata();

  constructor(private programsService: ProgramsServiceApiService) {
    this.resetTextFilter();
  }

  public setTextFilterColumn(column: string) {
    this.textFilter.column = column;
  }

  public setTextFilterValue(value: string) {
    this.textFilter.value = value;
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

    let filters: string[][] = null;

    if (this.textFilter?.column && this.textFilter?.value) {
      filters = [[this.textFilter.column, this.textFilter.value]];
    }

    const { data, meta } = await this.programsService.getPeopleAffected(
      programId,
      this.pageMetaData.itemsPerPage,
      this.pageMetaData.currentPage,
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

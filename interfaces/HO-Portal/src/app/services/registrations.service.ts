import { Injectable } from '@angular/core';
import { RegistrationStatusEnum } from '../../../../../services/121-service/src/registration/enum/registration-status.enum';
import { PaginationMetadata } from '../models/pagination-metadata.model';
import { Person } from '../models/person.model';
import { FilterService, TableTextFilter } from './filter.service';
import { ProgramsServiceApiService } from './programs-service-api.service';

@Injectable({
  providedIn: 'root',
})
export class RegistrationsService {
  private pageMetaData = new PaginationMetadata();
  private textFilter: TableTextFilter[];

  constructor(
    private programsService: ProgramsServiceApiService,
    private filterService: FilterService,
  ) {
    this.filterService
      .getTextFilterSubscription()
      .subscribe(this.onTextFilterChange);
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

  private onTextFilterChange(filter: TableTextFilter[]) {
    this.textFilter = filter;
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

    // let filters: string[][] = null;

    // if (this.textFilter?.column && this.textFilter?.value) {
    //   filters = [[this.textFilter.column, this.textFilter.value]];
    // }

    const { data, meta } = await this.programsService.getPeopleAffected(
      programId,
      this.pageMetaData.itemsPerPage,
      this.pageMetaData.currentPage,
      referenceId,
      filterOnPayment,
      attributes,
      statuses,
      this.textFilter,
    );

    this.pageMetaData.totalItems = meta.totalItems;
    this.pageMetaData.currentPage = meta.currentPage - 1;

    return { data, meta };
  }

  public getPageMetadata(): PaginationMetadata {
    return this.pageMetaData;
  }
}

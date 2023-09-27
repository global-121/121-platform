import { Injectable } from '@angular/core';
import { RegistrationStatusEnum } from '../../../../../services/121-service/src/registration/enum/registration-status.enum';

import { PaginationMetadata } from '../models/pagination-metadata.model';
import { Person } from '../models/person.model';
import { PaginationFilter } from './filter.service';
import { ProgramsServiceApiService } from './programs-service-api.service';

@Injectable({
  providedIn: 'root',
})
export class RegistrationsService {
  private pageMetaData = new PaginationMetadata();

  constructor(private programsService: ProgramsServiceApiService) {}

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
    textFilter: PaginationFilter[],
  ): Promise<{ data: Person[]; meta: PaginationMetadata }> {
    if (!programId) {
      return { data: [], meta: { itemsPerPage: 20, currentPage: 1 } };
    }

    const { data, meta } = await this.programsService.getPeopleAffected(
      programId,
      this.pageMetaData.itemsPerPage,
      this.pageMetaData.currentPage + 1,
      referenceId,
      filterOnPayment,
      attributes,
      statuses,
      textFilter,
    );

    this.pageMetaData.totalItems = meta.totalItems;
    this.pageMetaData.currentPage = meta.currentPage - 1;

    return { data, meta };
  }

  public getPageMetadata(): PaginationMetadata {
    return this.pageMetaData;
  }
}

import { FinancialServiceProviders } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';
import { environment } from '../../environments/environment';
import { UserRole } from '../auth/user-role.enum';
import { ApiPath } from '../enums/api-path.enum';
import {
  FilterOperator,
  FilterParameter,
  SortDirection,
} from '../enums/filters.enum';
import RegistrationStatus from '../enums/registration-status.enum';
import { ActionType, LatestAction } from '../models/actions.model';
import { Event } from '../models/event.model';
import { ExportType } from '../models/export-type.model';
import { FinancialServiceProviderConfiguration } from '../models/fsp.model';
import { ImportType } from '../models/import-type.enum';
import { Wallet } from '../models/intersolve-visa-wallet.model';
import { Message, MessageTemplate } from '../models/message.model';
import { PaginationMetadata } from '../models/pagination-metadata.model';
import { PaymentData } from '../models/payment.model';
import { Note, Person } from '../models/person.model';
import {
  PaTableAttribute,
  Program,
  ProgramStats,
} from '../models/program.model';
import {
  PaymentSummary,
  ProgramPaymentsStatus,
  Transaction,
} from '../models/transaction.model';
import { Role, TableData, User, UserSearchResult } from '../models/user.model';
import { ImportResult } from '../program/bulk-import/bulk-import.component';
import { arrayToXlsx } from '../shared/array-to-xlsx';
import { ApiService } from './api.service';
import { PaginationFilter, PaginationSort } from './filter.service';

@Injectable({
  providedIn: 'root',
})
export class ProgramsServiceApiService {
  constructor(private apiService: ApiService) {}

  login(username: string, password: string): Promise<User | null> {
    console.log('ProgramsService : login()');

    return this.apiService
      .post(
        environment.url_121_service_api,
        ApiPath.usersLogin,
        {
          username,
          password,
        },
        true,
      )
      .then((response) => {
        if (response) {
          return response;
        }
        return null;
      });
  }

  logout(): Promise<null> {
    return this.apiService.post(
      environment.url_121_service_api,
      '/users/logout',
      {},
      true,
    );
  }

  changePassword(
    username: string,
    password: string,
    newPassword: string,
  ): Promise<null> {
    return this.apiService.post(
      environment.url_121_service_api,
      '/users/password',
      {
        username,
        password,
        newPassword,
      },
    );
  }

  deleteRegistrations(
    programId: number,
    dryRun = false,
    filters?: PaginationFilter[],
  ): Promise<any> {
    const params = this.filtersToParams(filters, dryRun);
    return this.apiService.delete(
      environment.url_121_service_api,
      `/programs/${programId}/registrations`,
      { reason: '-' }, // In the portal, the reason is always set to '-'. Setting a different reason is only supported in the new interface
      params,
    );
  }

  async getAllProgramsStats(programIds: number[]): Promise<ProgramStats[]> {
    const programStats: ProgramStats[] = [];

    for (const programId of programIds) {
      const stats = await this.apiService.get(
        environment.url_121_service_api,
        `/programs/${programId}/metrics/program-stats-summary`,
      );

      programStats.push(stats);
    }

    return programStats;
  }

  getProgramById(programId: number | string): Promise<Program> {
    return this.apiService.get(
      environment.url_121_service_api,
      `/programs/${programId}`,
    );
  }

  getPaTableAttributes(
    programId: number | string,
    options?: {
      includeProgramRegistrationAttributes?: boolean;
      includeTemplateDefaultAttributes?: boolean;
      filterShowInRegistrationsTable?: boolean;
    },
  ): Promise<PaTableAttribute[]> {
    let params = new HttpParams();
    const defaultOptions = {
      includeProgramRegistrationAttributes: true,
      includeTemplateDefaultAttributes: false,
      filterShowInRegistrationsTable: true,
    };
    params = params.appendAll(Object.assign(defaultOptions, options));

    return this.apiService.get(
      environment.url_121_service_api,
      `/programs/${programId}/attributes`,
      null,
      null,
      params,
    );
  }

  getPastPayments(programId: number | string): Promise<PaymentData[]> {
    return this.apiService
      .get(environment.url_121_service_api, `/programs/${programId}/payments`)
      .then((response) =>
        response
          .map((element) => {
            element.id = element.payment;
            element.paymentDate = new Date(element.paymentDate);
            return element;
          })
          .sort(
            (a: PaymentData, b: PaymentData) =>
              // Sort by payment-id (as the back-end doesn't do that)
              a.id - b.id,
          ),
      );
  }

  getTransactions(
    programId: number | string,
    referenceId: string,
    payment?: number,
  ): Promise<Transaction[]> {
    let params = new HttpParams();
    params = params.append('referenceId', referenceId);
    if (payment) {
      params = params.append('payment', payment);
    }
    return this.apiService.get(
      environment.url_121_service_api,
      `/programs/${programId}/transactions`,
      false,
      false,
      params,
    );
  }

  getPaymentSummary(
    programId: number | string,
    payment: number | string,
  ): Promise<PaymentSummary> {
    return this.apiService.get(
      environment.url_121_service_api,
      `/programs/${programId}/payments/${payment}`,
    );
  }

  getProgramPaymentsStatus(
    programId: number | string,
  ): Promise<ProgramPaymentsStatus> {
    return this.apiService.get(
      environment.url_121_service_api,
      `/programs/${programId}/payments/status`,
    );
  }

  async updatePaAttribute(
    programId: number,
    referenceId: string,
    attribute: string,
    value: string | number | string[],
    reason?: string,
  ): Promise<Person | Error> {
    const data = {};
    data[attribute] = value;
    return this.apiService.patch(
      environment.url_121_service_api,
      `/programs/${programId}/registrations/${referenceId}`,
      {
        reason: reason,
        data,
      },
    );
  }

  postNote(
    programId: number,
    referenceId: string,
    note: string,
  ): Promise<Note> {
    return this.apiService.post(
      environment.url_121_service_api,
      `/programs/${programId}/registrations/${referenceId}/notes`,
      {
        text: note,
      },
    );
  }

  getNotes(programId: number, referenceId: string): Promise<Note[]> {
    return this.apiService.get(
      environment.url_121_service_api,
      `/programs/${programId}/registrations/${referenceId}/notes`,
      null,
      false,
    );
  }

  retrieveMsgHistory(
    programId: number,
    referenceId: string,
  ): Promise<Message[]> {
    return this.apiService.get(
      environment.url_121_service_api,
      `/programs/${programId}/registrations/${referenceId}/messages`,
    );
  }

  doPayment(
    programId: number,
    payment: number,
    amount: number,
    dryRun = false,
    filters?: PaginationFilter[],
  ): Promise<any> {
    const params = this.filtersToParams(filters, dryRun);
    return this.apiService.post(
      environment.url_121_service_api,
      `/programs/${programId}/payments`,
      {
        payment: Number(payment),
        amount: Number(amount),
      },
      false,
      false,
      false,
      params,
    );
  }

  patchPayout(
    programId: number,
    payment: number,
    referenceIds?: string[],
  ): Promise<any> {
    return this.apiService.patch(
      environment.url_121_service_api,
      `/programs/${programId}/payments`,
      {
        payment: Number(payment),
        referenceIds: referenceIds ? { referenceIds } : null,
      },
    );
  }

  async downloadImportTemplate(
    programId: number,
    type: ImportType,
  ): Promise<void> {
    const downloadData: string[] = await this.apiService.get(
      environment.url_121_service_api,
      `/programs/${programId}/registrations/import/template`,
      false,
    );

    const csvContents = downloadData.join(';') + '\r\n';

    saveAs(
      new Blob([csvContents], { type: 'text/csv' }),
      `${type}-TEMPLATE.csv`,
    );
    return;
  }

  import(programId: number, file: File): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    const path = `/programs/${programId}/registrations/import`;

    return new Promise<ImportResult>((resolve, reject) => {
      this.apiService
        .post(
          environment.url_121_service_api,
          path,
          formData,
          false,
          false,
          true,
        )
        .then((response) => {
          if (response.error) {
            throw response;
          }
          if (response) {
            return resolve(response);
          }
        })
        .catch((err) => reject(err));
    });
  }

  async downloadFspInstructionsImportTemplate(
    programId: number,
    type: ImportType,
  ): Promise<void> {
    const templates: { name: string; template: string[] }[] =
      await this.apiService.get(
        environment.url_121_service_api,
        `/programs/${programId}/payments/excel-reconciliation/template`,
      );

    for (const template of templates) {
      const csvContents = template.template.join(';') + '\r\n';

      saveAs(
        new Blob([csvContents], { type: 'text/csv' }),
        `${type}-${template.name}-TEMPLATE.csv`,
      );
    }
    return;
  }

  exportFspInstructions(programId: number, payment: number) {
    return this.apiService.get(
      environment.url_121_service_api,
      `/programs/${programId}/payments/${payment}/fsp-instructions`,
    );
  }

  importFspReconciliation(
    programId: number,
    payment: number,
    file: File,
  ): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    const path = `/programs/${programId}/payments/${payment}/excel-reconciliation`;

    return new Promise<ImportResult>((resolve, reject) => {
      this.apiService
        .post(
          environment.url_121_service_api,
          path,
          formData,
          false,
          false,
          true,
        )
        .then((response) => {
          if (response.error) {
            throw response;
          }
          if (response) {
            return resolve(response);
          }
        })
        .catch((err) => reject(err));
    });
  }

  exportList(
    programId: number,
    type: ExportType,
    fromDate?: string,
    toDate?: string,
    minPayment?: number,
    maxPayment?: number,
    allPeopleAffectedOptions?: {
      limit: number;
      page: number;
      referenceId?: string;
      filterOnPayment?: number;
      attributes?: string[];
      statuses?: RegistrationStatus[];
      filters?: PaginationFilter[];
      sort?: PaginationSort;
    },
  ): Promise<any> {
    let params = new HttpParams();
    const xlsxFormat = 'xlsx';
    params = params.append('format', xlsxFormat);
    if (fromDate) {
      params = params.append('fromDate', fromDate);
    }
    if (toDate) {
      params = params.append('toDate', toDate);
    }
    if (minPayment) {
      params = params.append('minPayment', minPayment);
    }
    if (maxPayment) {
      params = params.append('maxPayment', maxPayment);
    }
    if (type === ExportType.allRegistrations && allPeopleAffectedOptions) {
      params = params.append('limit', allPeopleAffectedOptions.limit);
      params = params.append('page', allPeopleAffectedOptions.page);
      // TODO: This still needs to be added to the back-end in a future item
      if (allPeopleAffectedOptions.referenceId) {
        params = params.append(
          'filter.referenceId',
          allPeopleAffectedOptions.referenceId,
        );
      }
      if (allPeopleAffectedOptions.filterOnPayment) {
        params = params.append(
          'filterOnPayment',
          allPeopleAffectedOptions.filterOnPayment,
        );
      }
      if (allPeopleAffectedOptions.attributes) {
        params = params.append(
          'select',
          allPeopleAffectedOptions.attributes.join(),
        );
      }
      if (allPeopleAffectedOptions.statuses) {
        params = params.append(
          'filter.status',
          `$in:${allPeopleAffectedOptions.statuses.join(',')}`,
        );
      }
      if (allPeopleAffectedOptions.filters) {
        params = this.filtersToParams(
          allPeopleAffectedOptions?.filters,
          false,
          params,
        );
      }
      if (allPeopleAffectedOptions.sort) {
        params = params.append(
          'sortBy',
          `${allPeopleAffectedOptions.sort.column}:${allPeopleAffectedOptions.sort.direction}`,
        );
      }
    }
    if (type === ExportType.paDataChanges) {
      return this.apiService
        .get(
          environment.url_121_service_api,
          `/programs/${programId}/events`,
          false,
          true,
          params,
        )
        .then((response) => {
          return response;
        });
    }
    return this.apiService
      .get(
        environment.url_121_service_api,
        `/programs/${programId}/metrics/export-list/${type}`,
        false,
        true,
        params,
      )
      .then((response) => {
        return response;
      });
  }

  exportVoucher(
    referenceId: string,
    payment: number,
    programId: number,
  ): Promise<Blob> {
    let params = new HttpParams();
    params = params.append('referenceId', referenceId);
    params = params.append('payment', payment);

    return this.apiService.get(
      environment.url_121_service_api,
      `/programs/${programId}/financial-service-providers/intersolve-voucher/vouchers`,
      false,
      true,
      params,
    );
  }

  getBalance(
    referenceId: string,
    payment: number,
    programId: number,
  ): Promise<number> {
    let params = new HttpParams();
    params = params.append('referenceId', referenceId);
    params = params.append('payment', payment);
    return this.apiService.get(
      environment.url_121_service_api,
      `/programs/${programId}/financial-service-providers/intersolve-voucher/vouchers/balance`,
      false,
      false,
      params,
    );
  }

  public async getUpdateWalletAndCards(
    programId: number,
    referenceId: string,
  ): Promise<Wallet> {
    const result = await this.apiService.patch(
      environment.url_121_service_api,
      `/programs/${programId}/registrations/${referenceId}/financial-service-providers/intersolve-visa/wallet`,
      {},
    );
    return result;
  }

  public async reissueCard(
    programId: number,
    referenceId: string,
  ): Promise<any> {
    const res = await this.apiService.post(
      environment.url_121_service_api,
      `/programs/${programId}/registrations/${referenceId}/financial-service-providers/intersolve-visa/wallet/cards`,
      {},
    );

    return res;
  }

  public async pauseCard(
    programId: number,
    referenceId: string,
    tokenCode: string,
    pause: boolean,
  ): Promise<any> {
    return await this.apiService.patch(
      environment.url_121_service_api,
      `/programs/${programId}/registrations/${referenceId}/financial-service-providers/intersolve-visa/wallet/cards/${tokenCode}?pause=${pause}`,
      {},
    );
  }

  async getPeopleAffected(
    programId: number | string,
    limit: number,
    page: number,
    referenceId?: string,
    filterOnPayment?: number,
    attributes?: string[],
    statuses?: RegistrationStatus[],
    filters?: PaginationFilter[],
    sort?: PaginationSort,
  ): Promise<{
    data: Person[];
    meta: PaginationMetadata;
    links: {
      current: string;
      first: string;
      last: string;
      next: string;
      previous: string;
    };
  }> {
    let params = new HttpParams();

    params = params.append('limit', limit);
    params = params.append('page', page);

    const defaultSortOption: PaginationSort = {
      column: 'created',
      direction: SortDirection.DESC,
    };

    // TODO: This still needs to be added to the back-end in a future item
    if (referenceId) {
      params = params.append('filter.referenceId', referenceId);
    }
    if (filterOnPayment) {
      params = params.append('filterOnPayment', filterOnPayment);
    }
    if (attributes) {
      params = params.append('select', attributes.join());
    }
    if (statuses) {
      params = params.append(
        'filter.status',
        `${FilterOperator.in}:${statuses.join(',')}`,
      );
    }
    if (filters) {
      params = this.filtersToParams(filters, false, params);
    }
    if (sort) {
      params = params.append('sortBy', `${sort.column}:${sort.direction}`);
    } else {
      params = params.append(
        'sortBy',
        `${defaultSortOption.column}:${defaultSortOption.direction}`,
      );
    }

    const { data, meta, links } = await this.apiService.get(
      environment.url_121_service_api,
      `/programs/${programId}/registrations`,
      false,
      false,
      params,
    );
    return { data, meta, links };
  }

  private updatePaStatus(
    action: string,
    programId: number | string,
    dryRun = false,
    filters?: PaginationFilter[],
    message?: string,
    messageTemplateKey?: string,
  ): Promise<any> {
    const params = this.filtersToParams(filters, dryRun);
    return this.apiService.patch(
      environment.url_121_service_api,
      `/programs/${programId}/registrations/status`,
      {
        status: action,
        message,
        messageTemplateKey,
        reason: '-', // In the portal, the reason is always set to '-'. Setting a different reason is only supported in the new interface
      },
      false,
      false,
      params,
    );
  }

  markAsValidated(
    programId: number | string,
    dryRun = false,
    filters?: PaginationFilter[],
  ): Promise<any> {
    return this.updatePaStatus(
      RegistrationStatus.validated,
      programId,
      dryRun,
      filters,
    );
  }

  markAsDeclined(
    programId: number | string,
    message: string,
    dryRun = false,
    filters?: PaginationFilter[],
    messageTemplateKey?: string,
  ): Promise<any> {
    return this.updatePaStatus(
      RegistrationStatus.declined,
      programId,
      dryRun,
      filters,
      message,
      messageTemplateKey,
    );
  }

  include(
    programId: number | string,
    message: string,
    dryRun = false,
    filters?: PaginationFilter[],
    messageTemplateKey?: string,
  ): Promise<any> {
    return this.updatePaStatus(
      RegistrationStatus.included,
      programId,
      dryRun,
      filters,
      message,
      messageTemplateKey,
    );
  }

  pause(
    programId: number | string,
    message: string,
    dryRun = false,
    filters?: PaginationFilter[],
    messageTemplateKey?: string,
  ): Promise<any> {
    return this.updatePaStatus(
      RegistrationStatus.paused,
      programId,
      dryRun,
      filters,
      message,
      messageTemplateKey,
    );
  }

  sendMessage(
    programId: number,
    message: string,
    dryRun = false,
    filters?: PaginationFilter[],
    messageTemplateKey?: string,
  ): Promise<any> {
    const params = this.filtersToParams(filters, dryRun);
    return this.apiService.post(
      environment.url_121_service_api,
      `/programs/${programId}/registrations/message`,
      {
        message,
        skipMessageValidation: dryRun,
        messageTemplateKey,
      },
      false,
      false,
      false,
      params,
    );
  }

  retrieveLatestActions(
    actionType: ExportType | ActionType,
    programId: number | string,
  ): Promise<LatestAction> {
    let params = new HttpParams();
    params = params.append('actionType', actionType);
    return this.apiService.get(
      environment.url_121_service_api,
      `/programs/${programId}/actions`,
      false,
      false,
      params,
    );
  }

  addUser(email: string, password: string): Promise<any> {
    return this.apiService.post(environment.url_121_service_api, '/users', {
      email,
      password,
    });
  }

  assignAidworker(
    programId: number | string,
    userId: number,
    roles: UserRole[] | string[],
    scope: string,
  ): Promise<Program> {
    return this.apiService.put(
      environment.url_121_service_api,
      `/programs/${programId}/users/${userId}`,
      {
        roles,
        scope,
      },
    );
  }

  unAssignAidworker(
    programId: number | string,
    userId: number,
  ): Promise<Program> {
    return this.apiService.delete(
      environment.url_121_service_api,
      `/programs/${programId}/users/${userId}`,
    );
  }

  getPaymentsWithStateSums(programId: number | string): Promise<any> {
    return this.apiService.get(
      environment.url_121_service_api,
      `/programs/${programId}/metrics/payment-state-sums`,
    );
  }

  getFspByName(
    fspName: FinancialServiceProviders,
  ): Promise<FinancialServiceProviderConfiguration> {
    return this.apiService.get(
      environment.url_121_service_api,
      '/financial-service-providers/' + fspName,
    );
  }

  updateProgram(programId: number, updateBody: object): Promise<Program> {
    return this.apiService.patch(
      environment.url_121_service_api,
      `/programs/${programId}`,
      updateBody,
    );
  }

  async getDuplicateCheckAttributes(programId: number): Promise<string[]> {
    const program = await this.getProgramById(programId);
    const attributeNames: string[] = []
      .concat(program.programRegistrationAttributes)
      .filter((attribute) => attribute.duplicateCheck === true)
      .map((attribute) => attribute.name);

    return [...new Set(attributeNames)]; // Deduplicates attributeNames
  }

  getPaByPhoneNr(phoneNumber: string): Promise<Person[]> {
    return this.apiService.get(
      environment.url_121_service_api,
      `/registrations/?phonenumber=${phoneNumber}`,
    );
  }

  async getReferenceId(
    programId: number,
    paId: number,
  ): Promise<{ referenceId: string }> {
    return this.apiService.get(
      environment.url_121_service_api,
      `/programs/${programId}/registrations/referenceid/${paId}`,
    );
  }

  async getRegistrationEventsByRegistrationId(
    programId: number,
    registrationId: number,
  ): Promise<Event[]> {
    return await this.apiService.get(
      environment.url_121_service_api,
      `/programs/${programId}/registrations/${registrationId}/events`,
    );
  }

  async getRegistrationStatusCount(
    programId: number,
  ): Promise<{ status: RegistrationStatus; statusCount: number }[]> {
    return await this.apiService.get(
      environment.url_121_service_api,
      `/programs/${programId}/metrics/registration-status`,
    );
  }

  getAllUsers(): Promise<TableData[] | null> {
    return this.apiService.get(environment.url_121_service_api, '/users');
  }

  getRoles(): Promise<Role[] | null> {
    return this.apiService.get(environment.url_121_service_api, '/roles');
  }

  getUsersByName(
    programId: number | string,
    username: string,
  ): Promise<UserSearchResult[]> {
    return this.apiService.get(
      environment.url_121_service_api,
      `/programs/${programId}/users/search?username=${username}`,
    );
  }

  getUsersByProgram(programId: number): Promise<any> {
    return this.apiService.get(
      environment.url_121_service_api,
      `/programs/${programId}/users`,
    );
  }

  async getCbeVerificationReport(programId: number): Promise<{
    data: {
      registrationProgramId: number;
      fullNameUsedForTheMatch: string;
      bankAccountNumberUsedForCall: string;
      cbeName: string;
      namesMatch: boolean;
      errorMessage: string;
      cbeStatus: string;
      lastUpdated: string;
    }[];
    fileName: string;
  }> {
    return this.apiService
      .get(
        environment.url_121_service_api,
        `/programs/${programId}/financial-service-providers/commercial-bank-ethiopia/account-enquiries`,
      )
      .then((response) => {
        if (response.data && response.data.length > 0) {
          arrayToXlsx(response.data, response.fileName);
        }
        return response;
      });
  }

  private filtersToParams(
    filters: PaginationFilter[],
    dryRun: boolean,
    existingParams?: HttpParams,
  ): HttpParams {
    let params: HttpParams;

    if (existingParams) {
      params = existingParams;
    } else {
      params = new HttpParams();
    }

    params = params.append('dryRun', dryRun);

    if (filters) {
      for (const filter of filters) {
        if (filter.name === FilterParameter.search) {
          params = params.append(FilterParameter.search, filter.value);
          continue;
        }

        const defaultFilter = FilterOperator.ilike;
        const operator = filter.operator ? filter.operator : defaultFilter;
        params = params.append(
          `filter.${filter.name}`,
          `${operator}:${filter.value}`,
        );
      }
    }

    return params;
  }

  getMessageTemplatesByProgram(programId: number): Promise<MessageTemplate[]> {
    return this.apiService.get(
      environment.url_121_service_api,
      `/notifications/${programId}/message-templates`,
    );
  }

  public async getCurrentUser(): Promise<{
    user?: User;
    error?: { message: string; username?: string };
  }> {
    return this.apiService
      .get(environment.url_121_service_api, ApiPath.usersCurrent)
      .then((response) => {
        return response;
      })
      .catch((error) => {
        return error;
      });
  }

  createProgramFromKobo(token: string, assetId: string): Promise<Program> {
    return this.apiService.post(
      environment.url_121_service_api,
      `/programs?importFromKobo=true${token ? `&koboToken=${token}` : ''}${assetId ? `&koboAssetId=${assetId}` : ''}`,
      {},
    );
  }

  createProgram(program: Program): Promise<Program> {
    return this.apiService.post(
      environment.url_121_service_api,
      '/programs',
      program,
    );
  }
}

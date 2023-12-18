import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';
import { environment } from '../../environments/environment';
import { UserRole } from '../auth/user-role.enum';
import RegistrationStatus from '../enums/registration-status.enum';
import { ActionType, LatestAction } from '../models/actions.model';
import { ExportType } from '../models/export-type.model';
import { Fsp } from '../models/fsp.model';
import { ImportType } from '../models/import-type.enum';
import { Message, MessageTemplate } from '../models/message.model';
import { PaginationMetadata } from '../models/pagination-metadata.model';
import { PaymentData } from '../models/payment.model';
import { Note, Person } from '../models/person.model';
import { PhysicalCard } from '../models/physical-card.model';
import { ProgramMetrics } from '../models/program-metrics.model';
import {
  PaTableAttribute,
  Program,
  ProgramPhase,
  ProgramStats,
} from '../models/program.model';
import { RegistrationChangeLog } from '../models/registration-change-log.model';
import { RegistrationStatusChange } from '../models/registration-status-change.model';
import { PaymentSummary, Transaction } from '../models/transaction.model';
import { Role, TableData, User, UserSearchResult } from '../models/user.model';
import { ImportResult } from '../program/bulk-import/bulk-import.component';
import { arrayToXlsx } from '../shared/array-to-xlsx';
import { ApiService } from './api.service';
import {
  FilterOperatorEnum,
  PaginationFilter,
  PaginationSort,
} from './filter.service';

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
        '/users/login',
        {
          username,
          password,
        },
        true,
      )
      .then((response) => {
        if (response) {
          return {
            username: response.username,
            permissions: response.permissions,
            expires: response.expires,
            isAdmin: response.isAdmin,
          };
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
    const params = this.filterToParams(filters, dryRun);
    return this.apiService.delete(
      environment.url_121_service_api,
      `/programs/${programId}/registrations`,
      null,
      false,
      params,
    );
  }

  getAllPrograms(): Promise<Program[]> {
    return this.apiService
      .get(environment.url_121_service_api, '/programs/assigned/all')
      .then((response) => {
        if (response && response.programs) {
          return response.programs;
        }
        return [];
      });
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
      includeCustomAttributes?: boolean;
      includeProgramQuestions?: boolean;
      includeFspQuestions?: boolean;
      phase?: ProgramPhase;
    },
  ): Promise<PaTableAttribute[]> {
    let params = new HttpParams();
    const defaultOptions = {
      includeCustomAttributes: true,
      includeProgramQuestions: true,
      includeFspQuestions: true,
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

  advancePhase(programId: number, newPhase: string): Promise<any> {
    return this.apiService.patch(
      environment.url_121_service_api,
      `/programs/${programId}`,
      {
        phase: newPhase,
      },
    );
  }

  getMetricsById(programId: number | string): Promise<ProgramMetrics> {
    return this.apiService.get(
      environment.url_121_service_api,
      `/programs/${programId}/metrics/person-affected`,
    );
  }

  getMetricsByIdWithCondition(
    programId: number | string,
    condition: string,
  ): Promise<ProgramMetrics> {
    return this.apiService.get(
      environment.url_121_service_api,
      `/programs/${programId}/metrics/person-affected?${condition}`,
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
  ): Promise<Transaction[]> {
    let params = new HttpParams();
    params = params.append('referenceId', referenceId);
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
      `/programs/${programId}/notes`,
      {
        referenceId,
        text: note,
      },
      false,
    );
  }

  getNotes(programId: number, referenceId: string): Promise<Note[]> {
    return this.apiService.get(
      environment.url_121_service_api,
      `/programs/${programId}/notes/${referenceId}`,
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
      `/programs/${programId}/registrations/message-history/${referenceId}`,
    );
  }

  getTransaction(
    referenceId: string,
    programId: number,
    payment: number,
    customDataKey: string,
    customDataValue: string,
  ): Promise<any | Transaction> {
    let params = new HttpParams();
    params = params.append('referenceId', referenceId);
    params = params.append('payment', payment);
    if (customDataKey) {
      params = params.append('customDataKey', customDataKey);
    }
    if (customDataValue) {
      params = params.append('customDataValue', customDataValue);
    }
    return this.apiService.get(
      environment.url_121_service_api,
      `/programs/${programId}/transactions/one`,
      false,
      false,
      params,
    );
  }

  doPayment(
    programId: number,
    payment: number,
    amount: number,
    dryRun = false,
    filters?: PaginationFilter[],
  ): Promise<any> {
    const params = this.filterToParams(filters, dryRun);
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
      `/programs/${programId}/registrations/import-template/${type}`,
      false,
    );

    const csvContents = downloadData.join(';') + '\r\n';

    saveAs(
      new Blob([csvContents], { type: 'text/csv' }),
      `${type}-TEMPLATE.csv`,
    );
    return;
  }

  import(
    programId: number,
    file: File,
    destination: RegistrationStatus = RegistrationStatus.imported,
  ): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    let path = `/programs/${programId}/registrations/import-bulk`;

    if (destination === RegistrationStatus.registered) {
      path = `/programs/${programId}/registrations/import-registrations`;
    }

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

  exportFspInstructions(programId: number, payment: number) {
    return this.apiService.get(
      environment.url_121_service_api,
      `/programs/${programId}/payments/${payment}/fsp-instructions`,
    );
  }

  importFspReconciliation(
    programId: number,
    payment: number,
    fspIds: number[],
    file: File,
  ): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    const path = `/programs/${programId}/payments/${payment}/fsp-reconciliation?fspIds=${fspIds.join(
      ',',
    )}`;

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
  ): Promise<any> {
    let params = new HttpParams();
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
    return this.apiService
      .get(
        environment.url_121_service_api,
        `/programs/${programId}/metrics/export-list/${type}`,
        false,
        false,
        params,
      )
      .then((response) => {
        if (response.data && response.data.length > 0) {
          arrayToXlsx(response.data, response.fileName);
        }
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

  public async getPhysicalCards(
    programId: number,
    referenceId: string,
  ): Promise<PhysicalCard[]> {
    const response = await this.apiService.get(
      environment.url_121_service_api,
      `/programs/${programId}/financial-service-providers/intersolve-visa/wallets?referenceId=${referenceId}`,
    );

    return !!response && !!response.wallets ? response.wallets : [];
  }

  public async issueNewCard(
    programId: number,
    referenceId: string,
  ): Promise<any> {
    const res = await this.apiService.put(
      environment.url_121_service_api,
      `/programs/${programId}/financial-service-providers/intersolve-visa/customers/${referenceId}/wallets`,
      {},
    );

    return res;
  }

  public async toggleBlockWallet(
    programId: number,
    tokenCode: string,
    block: boolean,
  ): Promise<any> {
    return await this.apiService.post(
      environment.url_121_service_api,
      `/programs/${programId}/financial-service-providers/intersolve-visa/wallets/${tokenCode}/${
        block ? 'block' : 'unblock'
      }`,
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
    // TODO: Fix the 'any' for the 'links' parameter
  ): Promise<{ data: Person[]; meta: PaginationMetadata; links: any }> {
    let params = new HttpParams();
    params = params.append('limit', limit);
    params = params.append('page', page);
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
      params = params.append('filter.status', `$in:${statuses.join(',')}`);
    }
    if (filters) {
      for (const filter of filters) {
        const defaultFilter = FilterOperatorEnum.ilike;
        const operator = filter.operator ? filter.operator : defaultFilter;
        params = params.append(
          `filter.${filter.name}`,
          `${operator}:${filter.value}`,
        );
      }
    }
    if (sort) {
      params = params.append('sortBy', `${sort.column}:${sort.direction}`);
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
    const params = this.filterToParams(filters, dryRun);
    return this.apiService.patch(
      environment.url_121_service_api,
      `/programs/${programId}/registrations/status`,
      {
        status: action,
        message,
        messageTemplateKey,
      },
      false,
      false,
      false,
      params,
    );
  }

  selectForValidation(
    programId: number | string,
    dryRun = false,
    filters?: PaginationFilter[],
  ): Promise<any> {
    return this.updatePaStatus(
      RegistrationStatus.selectedForValidation,
      programId,
      dryRun,
      filters,
    );
  }

  markNoLongerEligible(
    programId: number | string,
    dryRun = false,
    filters?: PaginationFilter[],
  ): Promise<any> {
    return this.updatePaStatus(
      RegistrationStatus.noLongerEligible,
      programId,
      dryRun,
      filters,
    );
  }

  invite(
    programId: number | string,
    message: string,
    dryRun = false,
    filters?: PaginationFilter[],
    messageTemplateKey?: string,
  ): Promise<any> {
    return this.updatePaStatus(
      RegistrationStatus.invited,
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

  end(
    programId: number | string,
    message: string,
    dryRun = false,
    filters?: PaginationFilter[],
    messageTemplateKey?: string,
  ): Promise<any> {
    return this.updatePaStatus(
      RegistrationStatus.inclusionEnded,
      programId,
      dryRun,
      filters,
      message,
      messageTemplateKey,
    );
  }

  reject(
    programId: number | string,
    message: string,
    dryRun = false,
    filters?: PaginationFilter[],
    messageTemplateKey?: string,
  ): Promise<any> {
    return this.updatePaStatus(
      RegistrationStatus.rejected,
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
  ): Promise<any> {
    const params = this.filterToParams(filters, dryRun);
    return this.apiService.post(
      environment.url_121_service_api,
      `/programs/${programId}/registrations/message`,
      {
        message,
        skipMessageValidation: dryRun,
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
  ): Promise<Program> {
    return this.apiService.put(
      environment.url_121_service_api,
      `/programs/${programId}/users/${userId}`,
      {
        roles,
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

  getFspById(fspId: number): Promise<Fsp> {
    return this.apiService.get(
      environment.url_121_service_api,
      '/financial-service-providers/' + fspId,
    );
  }

  updateChosenFsp(
    referenceId: string,
    programId: number,
    newFspName: string,
    newFspAttributes?: object,
  ): Promise<Fsp> {
    return this.apiService.put(
      environment.url_121_service_api,
      `/programs/${programId}/registrations/${referenceId}/fsp`,
      { newFspName, newFspAttributes },
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
    const fspAttributes = program.financialServiceProviders
      .filter((fsp) => !!fsp.questions)
      .map((fsp) => fsp.questions)
      .flat();

    const attributeNames: string[] = []
      .concat(
        program.programQuestions,
        program.programCustomAttributes,
        fspAttributes,
      )
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

  async getRegistrationChangeLogByReferenceId(
    programId: number,
    referenceId: string,
  ): Promise<RegistrationChangeLog[]> {
    return await this.apiService.get(
      environment.url_121_service_api,
      `/programs/${programId}/registration-change-logs/?referenceId=${referenceId}`,
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
      `/programs/${programId}/users?username=${username}`,
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

  private filterToParams(
    filters: PaginationFilter[],
    dryRun: boolean,
  ): HttpParams {
    let params = new HttpParams();
    params = params.append('dryRun', dryRun);
    if (filters) {
      for (const filter of filters) {
        const defaultFilter = FilterOperatorEnum.ilike;
        const operator = filter.operator ? filter.operator : defaultFilter;
        params = params.append(
          `filter.${filter.name}`,
          `${operator}:${filter.value}`,
        );
      }
    }
    return params;
  }

  public async getRegistrationStatusChanges(
    programId: number,
    referenceId: string,
  ): Promise<RegistrationStatusChange[]> {
    return this.apiService.get(
      environment.url_121_service_api,
      `/programs/${programId}/registrations/status-changes/${referenceId}`,
    );
  }

  getMessageTemplatesByProgram(programId: number): Promise<MessageTemplate[]> {
    return this.apiService.get(
      environment.url_121_service_api,
      `/notifications/${programId}/message-templates`,
    );
  }
}

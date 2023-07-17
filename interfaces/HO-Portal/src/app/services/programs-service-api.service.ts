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
import { Message } from '../models/message.model';
import { PaymentData, TotalTransferAmounts } from '../models/payment.model';
import { Note, Person } from '../models/person.model';
import { PhysicalCard } from '../models/physical-card.model';
import { ProgramMetrics } from '../models/program-metrics.model';
import {
  PaTableAttribute,
  Program,
  ProgramPhase,
  ProgramStats,
} from '../models/program.model';
import { Transaction } from '../models/transaction.model';
import { User } from '../models/user.model';
import { ImportResult } from '../program/bulk-import/bulk-import.component';
import { arrayToXlsx } from '../shared/array-to-xlsx';
import { ApiService } from './api.service';

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
        '/user/login',
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
          };
        }
        return null;
      });
  }

  logout(): Promise<null> {
    return this.apiService.post(
      environment.url_121_service_api,
      '/user/logout',
      {},
      true,
    );
  }

  changePassword(newPassword: string): Promise<null> {
    return this.apiService.post(
      environment.url_121_service_api,
      '/user/change-password',
      {
        password: newPassword,
      },
    );
  }

  deleteRegistrations(programId: number, referenceIds: string[]): Promise<any> {
    return this.apiService.post(
      environment.url_121_service_api,
      `/programs/${programId}/registrations/delete`,
      {
        referenceIds,
      },
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
        `/programs/${programId}/export-metrics/program-stats-summary`,
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
    phase: ProgramPhase,
  ): Promise<PaTableAttribute[]> {
    return this.apiService.get(
      environment.url_121_service_api,
      `/programs/${programId}/pa-table-attributes/${phase}`,
    );
  }

  advancePhase(programId: number, newPhase: string): Promise<any> {
    return this.apiService.post(
      environment.url_121_service_api,
      `/programs/${programId}/change-phase`,
      {
        newPhase,
      },
    );
  }

  getMetricsById(programId: number | string): Promise<ProgramMetrics> {
    return this.apiService.get(
      environment.url_121_service_api,
      `/programs/${programId}/export-metrics/person-affected`,
    );
  }

  getMetricsByIdWithCondition(
    programId: number | string,
    condition: string,
  ): Promise<ProgramMetrics> {
    return this.apiService.get(
      environment.url_121_service_api,
      `/programs/${programId}/export-metrics/person-affected?${condition}`,
    );
  }

  getTotalTransferAmounts(
    programId: number | string,
    referenceIds?: string[],
  ): Promise<TotalTransferAmounts> {
    return this.apiService.post(
      environment.url_121_service_api,
      `/programs/${programId}/export-metrics/total-transfer-amounts`,
      { referenceIds },
    );
  }

  getPastPayments(programId: number | string): Promise<PaymentData[]> {
    return this.apiService
      .get(environment.url_121_service_api, `/programs/${programId}/payments`)
      .then((response) =>
        response
          .map((element) => {
            // Remap `payment`-property to `id`:
            element.id = element.payment;
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
    minPayment?: number | string,
    referenceId?: string,
  ): Promise<Transaction[]> {
    let params = new HttpParams();
    if (minPayment) {
      params = params.append('minPayment', minPayment);
    }
    if (referenceId) {
      params = params.append('referenceId', referenceId);
    }
    return this.apiService.get(
      environment.url_121_service_api,
      `/programs/${programId}/payments/transactions`,
      false,
      params,
    );
  }

  async updatePaAttribute(
    programId: number,
    referenceId: string,
    attribute: string,
    value: string | number | string[],
  ): Promise<Person | Error> {
    return this.apiService.post(
      environment.url_121_service_api,
      `/programs/${programId}/registrations/attribute`,
      {
        referenceId,
        attribute,
        value,
      },
    );
  }

  updateNote(
    programId: number,
    referenceId: string,
    note: string,
  ): Promise<Note> {
    return this.apiService.post(
      environment.url_121_service_api,
      `/programs/${programId}/registrations/note`,
      {
        referenceId,
        note,
      },
    );
  }

  retrieveNote(programId: number, referenceId: string): Promise<Note> {
    return this.apiService.get(
      environment.url_121_service_api,
      `/programs/${programId}/registrations/note/${referenceId}`,
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
    return this.apiService.post(
      environment.url_121_service_api,
      `/programs/${programId}/payments/transactions/one`,
      {
        referenceId,
        payment: Number(payment),
        customDataKey,
        customDataValue,
      },
    );
  }

  submitPayout(
    programId: number,
    payment: number,
    amount: number,
    referenceIds: string[],
  ): Promise<any> {
    return this.apiService.post(
      environment.url_121_service_api,
      `/programs/${programId}/payments`,
      {
        payment: Number(payment),
        amount: Number(amount),
        referenceIds: { referenceIds },
      },
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
    minPayment?: number,
    maxPayment?: number,
  ): Promise<any> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        `/programs/${programId}/export-metrics/export-list`,
        {
          type,
          ...(minPayment && { minPayment }),
          ...(maxPayment && { maxPayment }),
        },
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
    return this.apiService.post(
      environment.url_121_service_api,
      `/programs/${programId}/payments/intersolve/export-voucher`,
      {
        referenceId,
        payment,
      },
      false,
      true,
    );
  }

  getBalance(
    referenceId: string,
    payment: number,
    programId: number,
  ): Promise<number> {
    return this.apiService.post(
      environment.url_121_service_api,
      `/programs/${programId}/payments/intersolve/balance`,
      {
        referenceId,
        payment,
      },
    );
  }

  public async getPhysicalCards(
    programId: number,
    referenceId: string,
  ): Promise<PhysicalCard[]> {
    const response = await this.apiService.get(
      environment.url_121_service_api,
      `/programs/${programId}/fsp-integration/intersolve-visa/wallets?referenceId=${referenceId}`,
    );

    return !!response && !!response.wallets ? response.wallets : [];
  }

  public async toggleBlockWallet(
    programId: number,
    tokenCode: string,
    block: boolean,
  ): Promise<any> {
    return await this.apiService.post(
      environment.url_121_service_api,
      `/programs/${programId}/fsp-integration/intersolve-visa/wallets/${tokenCode}/${
        block ? 'block' : 'unblock'
      }`,
      {},
    );
  }

  getPeopleAffected(
    programId: number | string,
    personalData: boolean,
    paymentData: boolean,
    referenceId?: string,
    filterOnPayment?: number,
    attributes?: string[],
  ): Promise<Person[]> {
    let params = new HttpParams();
    params = params.append('personalData', personalData);
    params = params.append('paymentData', paymentData);
    if (referenceId) {
      params = params.append('referenceId', referenceId);
    }
    if (filterOnPayment) {
      params = params.append('filterOnPayment', filterOnPayment);
    }
    if (attributes) {
      params = params.append('attributes', attributes.join());
    }
    return this.apiService.get(
      environment.url_121_service_api,
      `/programs/${programId}/registrations`,
      false,
      params,
    );
  }

  private updatePaStatus(
    action: string,
    programId: number | string,
    referenceIds: string[],
    message?: string,
  ): Promise<any> {
    return this.apiService.post(
      environment.url_121_service_api,
      `/programs/${programId}/registrations/${action}`,
      {
        referenceIds,
        message,
      },
    );
  }

  selectForValidation(
    programId: number | string,
    referenceIds: string[],
  ): Promise<any> {
    return this.updatePaStatus('select-validation', programId, referenceIds);
  }

  markNoLongerEligible(
    programId: number | string,
    referenceIds: string[],
  ): Promise<any> {
    return this.updatePaStatus('no-longer-eligible', programId, referenceIds);
  }

  invite(
    programId: number | string,
    referenceIds: string[],
    message: string,
  ): Promise<any> {
    return this.updatePaStatus('invite', programId, referenceIds, message);
  }

  include(
    programId: number | string,
    referenceIds: string[],
    message: string,
  ): Promise<any> {
    return this.updatePaStatus('include', programId, referenceIds, message);
  }

  end(
    programId: number | string,
    referenceIds: string[],
    message: string,
  ): Promise<any> {
    return this.updatePaStatus('end', programId, referenceIds, message);
  }

  reject(
    programId: number | string,
    referenceIds: string[],
    message: string,
  ): Promise<any> {
    return this.updatePaStatus('reject', programId, referenceIds, message);
  }

  sendMessage(
    referenceIds: string[],
    message: string,
    programId: number,
  ): Promise<any> {
    return this.apiService.post(
      environment.url_121_service_api,
      `/programs/${programId}/registrations/text-message`,
      {
        referenceIds,
        message,
      },
    );
  }

  saveAction(actionType: ActionType, programId: number | string): Promise<any> {
    return this.apiService.post(
      environment.url_121_service_api,
      `/programs/${programId}/actions/save`,
      {
        actionType,
      },
    );
  }

  retrieveLatestActions(
    actionType: ExportType | ActionType,
    programId: number | string,
  ): Promise<LatestAction> {
    return this.apiService.post(
      environment.url_121_service_api,
      `/programs/${programId}/actions/retrieve-latest`,
      {
        actionType,
      },
    );
  }

  addUser(email: string, password: string): Promise<any> {
    return this.apiService.post(
      environment.url_121_service_api,
      '/user/aidworker',
      {
        email,
        password,
      },
    );
  }

  assignAidworker(
    programId: number | string,
    userId: number,
    roles: UserRole[] | string[],
  ): Promise<Program> {
    return this.apiService.post(
      environment.url_121_service_api,
      `/programs/${programId}/users/${userId}/assignments`,
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
      `/programs/${programId}/users/${userId}/assignments`,
    );
  }

  getPaymentsWithStateSums(programId: number | string): Promise<any> {
    return this.apiService.get(
      environment.url_121_service_api,
      `/programs/${programId}/export-metrics/payment-state-sums`,
    );
  }

  getFspById(fspId: number): Promise<Fsp> {
    return this.apiService.get(
      environment.url_121_service_api,
      '/fsp/' + fspId,
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
    return this.apiService.post(
      environment.url_121_service_api,
      `/programs/${programId}/update`,
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
      false,
    );
  }

  async getReferenceId(
    programId: number,
    paId: number,
  ): Promise<{ referenceId: string }> {
    return this.apiService.get(
      environment.url_121_service_api,
      `/programs/${programId}/registrations/referenceid/${paId}`,
      false,
    );
  }
}

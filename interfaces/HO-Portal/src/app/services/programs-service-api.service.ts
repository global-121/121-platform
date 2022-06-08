import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { UserRole } from '../auth/user-role.enum';
import { ActionType, LatestAction } from '../models/actions.model';
import { ExportType } from '../models/export-type.model';
import { Fsp } from '../models/fsp.model';
import { ImportType } from '../models/import-type.enum';
import { PaymentData, TotalTransferAmounts } from '../models/payment.model';
import { Note, PaStatus, Person } from '../models/person.model';
import { ProgramMetrics } from '../models/program-metrics.model';
import { Program } from '../models/program.model';
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

  deleteUser(userId: string): Promise<any> {
    return this.apiService.post(
      environment.url_121_service_api,
      `/user/delete/${userId}`,
      {},
    );
  }

  deleteRegistrations(referenceIds: string[]): Promise<any> {
    return this.apiService.post(
      environment.url_121_service_api,
      `/registrations/delete`,
      {
        referenceIds,
      },
    );
  }

  getAllPrograms(): Promise<Program[]> {
    return this.apiService
      .get(environment.url_121_service_api, '/programs')
      .pipe(
        map((response) => {
          return response.programs;
        }),
      )
      .toPromise();
  }

  getProgramById(programId: number | string): Promise<Program> {
    return this.apiService
      .get(environment.url_121_service_api, `/programs/${programId}`)
      .toPromise();
  }

  advancePhase(programId: number, newPhase: string): Promise<any> {
    return this.apiService.post(
      environment.url_121_service_api,
      `/programs/change-phase/${programId}`,
      {
        newPhase,
      },
    );
  }

  getMetricsById(programId: number | string): Promise<ProgramMetrics> {
    return this.apiService
      .get(
        environment.url_121_service_api,
        `/export-metrics/person-affected/${programId}`,
      )
      .toPromise();
  }

  getMetricsByIdWithCondition(
    programId: number | string,
    condition: string,
  ): Promise<ProgramMetrics> {
    return this.apiService
      .get(
        environment.url_121_service_api,
        `/export-metrics/person-affected/${programId}?${condition}`,
      )
      .toPromise();
  }

  getTotalTransferAmounts(
    programId: number | string,
    referenceIds?: string[],
  ): Promise<TotalTransferAmounts> {
    return this.apiService.post(
      environment.url_121_service_api,
      `/export-metrics/total-transfer-amounts/${programId}`,
      { referenceIds },
    );
  }

  getPastPayments(programId: number | string): Promise<PaymentData[]> {
    return this.apiService
      .get(environment.url_121_service_api, `/programs/${programId}/payments`)
      .pipe(
        map((response) => {
          return response
            .map((element) => {
              // Remap `payment`-property to `id`:
              element.id = element.payment;
              return element;
            })
            .sort((a: PaymentData, b: PaymentData) => {
              // Sort by payment-id (as the back-end doesn't do that)
              return a.id - b.id;
            });
        }),
      )
      .toPromise();
  }

  getTransactions(
    programId: number | string,
    minPayment?: number | string,
  ): Promise<Transaction[]> {
    return this.apiService
      .get(
        environment.url_121_service_api,
        `/programs/${programId}/payments/transactions${
          minPayment ? '?minPayment=' + minPayment : ''
        }`,
      )
      .toPromise();
  }

  async updatePaAttribute(
    referenceId: string,
    attribute: string,
    value: string | number,
  ): Promise<Person | Error> {
    return this.apiService.post(
      environment.url_121_service_api,
      `/registrations/attribute`,
      {
        referenceId,
        attribute,
        value,
      },
    );
  }

  updateNote(referenceId: string, note: string): Promise<Note> {
    return this.apiService.post(
      environment.url_121_service_api,
      `/registrations/note`,
      {
        referenceId,
        note,
      },
    );
  }

  retrieveNote(referenceId: string): Promise<Note> {
    return this.apiService
      .get(
        environment.url_121_service_api,
        `/registrations/note/${referenceId}`,
      )
      .toPromise();
  }
  retrieveMsgHistory(referenceId: string): Promise<any> {
    return this.apiService
      .get(
        environment.url_121_service_api,
        `/registrations/message-history/${referenceId}`,
      )
      .toPromise();
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
    referenceIds?: string[],
  ): Promise<any> {
    return this.apiService.post(
      environment.url_121_service_api,
      `/programs/${programId}/payments`,
      {
        payment: Number(payment),
        amount: Number(amount),
        referenceIds: referenceIds ? { referenceIds } : null,
      },
    );
  }

  async downloadImportTemplate(
    programId: number,
    type: ImportType,
  ): Promise<void> {
    const downloadData: string[] = await this.apiService
      .get(
        environment.url_121_service_api,
        `/registrations/import-template/${programId}/${type}`,
        false,
      )
      .toPromise();

    const csvContents = downloadData.join(';') + '\r\n';

    saveAs(
      new Blob([csvContents], { type: 'text/csv' }),
      `program-${programId}_${type}_TEMPLATE.csv`,
    );
    return;
  }

  import(
    programId: number,
    file: File,
    destination: PaStatus = PaStatus.imported,
  ): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    let path = `/registrations/import-bulk/${programId}`;

    if (destination === PaStatus.registered) {
      path = `/registrations/import-registrations/${programId}`;
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
        .catch((err) => {
          return reject(err);
        });
    });
  }

  exportFspInstructions(programId: number, payment: number) {
    return this.apiService
      .get(
        environment.url_121_service_api,
        `/programs/${programId}/payments/${payment}/fsp-instructions`,
      )
      .toPromise();
  }

  exportList(
    programId: number,
    type: ExportType,
    minPayment?: number,
    maxPayment?: number,
  ): Promise<any> {
    return this.apiService
      .post(environment.url_121_service_api, `/export-metrics/export-list`, {
        programId,
        type,
        ...(minPayment && { minPayment }),
        ...(maxPayment && { maxPayment }),
      })
      .then((response) => {
        if (response.data) {
          arrayToXlsx(response.data, response.fileName);
        }
        return response;
      });
  }

  exportVoucher(referenceId: string, payment: number): Promise<Blob> {
    return this.apiService.post(
      environment.url_121_service_api,
      `/payments/intersolve/export-voucher`,
      {
        referenceId,
        payment,
      },
      false,
      true,
    );
  }

  getBalance(referenceId: string, payment: number): Promise<number> {
    return this.apiService.post(
      environment.url_121_service_api,
      `/payments/intersolve/balance`,
      {
        referenceId,
        payment,
      },
    );
  }

  getPeopleAffected(programId: number | string): Promise<Person[]> {
    return this.apiService
      .get(environment.url_121_service_api, `/registrations/${programId}`)
      .toPromise();
  }

  getPeopleAffectedPrivacy(programId: number | string): Promise<Person[]> {
    return this.apiService
      .get(
        environment.url_121_service_api,
        `/registrations/personal-data/${programId}`,
      )
      .toPromise();
  }

  private updatePaStatus(
    action: string,
    programId: number | string,
    referenceIds: string[],
    message?: string,
  ): Promise<any> {
    return this.apiService.post(
      environment.url_121_service_api,
      `/registrations/${action}/${programId}`,
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
    phoneNumbers: string[],
    message: string,
  ): Promise<any> {
    return this.apiService.post(
      environment.url_121_service_api,
      `/registrations/invite/${programId}`,
      {
        phoneNumbers: JSON.stringify(phoneNumbers),
        message,
      },
    );
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

  sendMessage(referenceIds: string[], message: string): Promise<any> {
    return this.apiService.post(
      environment.url_121_service_api,
      `/registrations/text-message`,
      {
        referenceIds,
        message,
      },
    );
  }

  saveAction(actionType: ActionType, programId: number | string): Promise<any> {
    return this.apiService.post(
      environment.url_121_service_api,
      `/actions/save`,
      {
        actionType,
        programId,
      },
    );
  }

  retrieveLatestActions(
    actionType: ExportType | ActionType,
    programId: number | string,
  ): Promise<LatestAction> {
    return this.apiService.post(
      environment.url_121_service_api,
      `/actions/retrieve-latest`,
      {
        actionType,
        programId: Number(programId),
      },
    );
  }

  addUser(email: string, password: string): Promise<any> {
    return this.apiService.post(
      environment.url_121_service_api,
      `/user/aidworker`,
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
      `/user/assign-to-program`,
      {
        programId,
        userId,
        roles,
      },
    );
  }

  getPaymentsWithStateSums(programId: number | string): Promise<any> {
    return this.apiService
      .get(
        environment.url_121_service_api,
        `/export-metrics/payment-state-sums/${programId}`,
      )
      .toPromise();
  }

  getFspById(fspId: number): Promise<Fsp> {
    return this.apiService
      .get(environment.url_121_service_api, '/fsp/' + fspId)
      .toPromise();
  }

  updateChosenFsp(
    referenceId: string,
    newFspName: string,
    newFspAttributes?: object,
  ): Promise<Fsp> {
    return this.apiService.post(
      environment.url_121_service_api,
      '/registrations/update-chosen-fsp',
      { referenceId, newFspName, newFspAttributes },
    );
  }

  updateProgram(programId: number, updateBody: object): Promise<Program> {
    return this.apiService.post(
      environment.url_121_service_api,
      `/programs/${programId}/update`,
      updateBody,
    );
  }
}

import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { UserRole } from '../auth/user-role.enum';
import { ActionType, LatestAction } from '../models/actions.model';
import { ExportType } from '../models/export-type.model';
import { csvTemplateImported, ImportType } from '../models/import-type.enum';
import { InstallmentData, TotalIncluded } from '../models/installment.model';
import { Note, PaStatus, Person } from '../models/person.model';
import { ProgramMetrics } from '../models/program-metrics.model';
import { Program } from '../models/program.model';
import { Transaction } from '../models/transaction.model';
import { UserModel } from '../models/user.model';
import { ImportResult } from '../program/bulk-import/bulk-import.component';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class ProgramsServiceApiService {
  constructor(private apiService: ApiService) {}

  login(email: string, password: string): Promise<UserModel | null> {
    console.log('ProgramsService : login()');

    return this.apiService
      .post(
        environment.url_121_service_api,
        '/user/login',
        {
          email,
          password,
        },
        true,
      )
      .pipe(
        map((response) => {
          if (response && response.user) {
            return {
              token: response.user.token,
            };
          }
          return null;
        }),
      )
      .toPromise();
  }

  changePassword(newPassword: string): Promise<UserModel | null> {
    return this.apiService
      .post(environment.url_121_service_api, '/user/change-password', {
        password: newPassword,
      })
      .pipe(
        map((response) => {
          if (response && response.user) {
            return {
              token: response.user.token,
            };
          }
          return null;
        }),
      )
      .toPromise();
  }

  deleteUser(userId: string): Promise<any> {
    return this.apiService
      .post(environment.url_121_service_api, `/user/delete/${userId}`, {})
      .toPromise();
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
    return this.apiService
      .post(
        environment.url_121_service_api,
        `/programs/changePhase/${programId}`,
        {
          newPhase,
        },
      )
      .toPromise();
  }

  getMetricsById(programId: number | string): Promise<ProgramMetrics> {
    return this.apiService
      .get(environment.url_121_service_api, `/programs/metrics/${programId}`)
      .toPromise();
  }

  getMetricsByIdWithCondition(
    programId: number | string,
    condition: string,
  ): Promise<ProgramMetrics> {
    return this.apiService
      .get(
        environment.url_121_service_api,
        `/programs/metrics/${programId}?${condition}`,
      )
      .toPromise();
  }

  getTotalIncluded(programId: number | string): Promise<TotalIncluded> {
    return this.apiService
      .get(
        environment.url_121_service_api,
        `/programs/total-included/${programId}`,
      )
      .toPromise();
  }

  getPastInstallments(programId: number | string): Promise<InstallmentData[]> {
    return this.apiService
      .get(
        environment.url_121_service_api,
        `/programs/installments/${programId}`,
      )
      .pipe(
        map((response) => {
          return response
            .map((element) => {
              // Remap `installment`-property to `id`:
              element.id = element.installment;
              return element;
            })
            .sort((a: InstallmentData, b: InstallmentData) => {
              // Sort by installment-id (as the back-end doesn't do that)
              return a.id - b.id;
            });
        }),
      )
      .toPromise();
  }

  getTransactions(
    programId: number | string,
    minInstallment?: number | string,
  ): Promise<Transaction[]> {
    return this.apiService
      .get(
        environment.url_121_service_api,
        `/programs/transactions/${programId}${
          minInstallment ? '?minInstallment=' + minInstallment : ''
        }`,
      )
      .toPromise();
  }

  updatePaAttribute(
    referenceId: string,
    attribute: string,
    value: string | number,
  ): Promise<Person> {
    return this.apiService
      .post(environment.url_121_service_api, `/registrations/attribute`, {
        referenceId,
        attribute,
        value,
      })
      .toPromise();
  }

  updateNote(referenceId: string, note: string): Promise<Note> {
    return this.apiService
      .post(environment.url_121_service_api, `/registrations/note`, {
        referenceId,
        note,
      })
      .toPromise();
  }

  retrieveNote(referenceId: string): Promise<Note> {
    return this.apiService
      .get(
        environment.url_121_service_api,
        `/registrations/note/${referenceId}`,
      )
      .toPromise();
  }

  getTransaction(
    referenceId: string,
    programId: number,
    installment: number,
    customDataKey: string,
    customDataValue: string,
  ): Promise<any | Transaction> {
    return this.apiService
      .post(environment.url_121_service_api, `/programs/get-transaction`, {
        referenceId,
        installment: Number(installment),
        programId: Number(programId),
        customDataKey,
        customDataValue,
      })
      .toPromise();
  }

  submitPayout(
    programId: number,
    installment: number,
    amount: number,
    referenceId?: string,
  ): Promise<any> {
    return this.apiService
      .post(environment.url_121_service_api, `/programs/payout`, {
        programId: Number(programId),
        installment: Number(installment),
        amount: Number(amount),
        referenceId,
      })
      .toPromise();
  }

  async downloadImportTemplate(
    programId: number,
    type: ImportType,
  ): Promise<void> {
    let downloadData: string[];

    if (type === ImportType.imported) {
      // Use a hard-coded value for the 'default' template:
      downloadData = csvTemplateImported;
    } else {
      downloadData = await this.apiService
        .get(
          environment.url_121_service_api,
          `/registrations/import-template/${programId}`,
          false,
        )
        .toPromise();
    }

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

    return this.apiService
      .post(environment.url_121_service_api, path, formData, false, false, true)
      .toPromise();
  }

  exportList(
    programId: number,
    type: ExportType,
    installment?: number,
  ): Promise<any> {
    return this.apiService
      .post(environment.url_121_service_api, `/registrations/export-list`, {
        programId,
        type,
        ...(installment && { installment }),
      })
      .pipe(
        map((response) => {
          if (response.data) {
            saveAs(
              new Blob([response.data], { type: 'text/csv' }),
              response.fileName,
            );
          }
          return response;
        }),
      )
      .toPromise();
  }

  exportVoucher(referenceId: string, installment: number): Promise<Blob> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        `/fsp/intersolve/export-voucher`,
        {
          referenceId,
          installment,
        },
        false,
        true,
      )
      .toPromise();
  }

  getBalance(referenceId: string, installment: number): Promise<number> {
    return this.apiService
      .post(environment.url_121_service_api, `/fsp/intersolve/balance`, {
        referenceId,
        installment,
      })
      .toPromise();
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
    return this.apiService
      .post(
        environment.url_121_service_api,
        `/programs/${action}/${programId}`,
        {
          referenceIds: JSON.stringify(referenceIds),
          message,
        },
      )
      .toPromise();
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
    return this.apiService
      .post(environment.url_121_service_api, `/programs/invite/${programId}`, {
        phoneNumbers: JSON.stringify(phoneNumbers),
        message,
      })
      .toPromise();
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

  saveAction(actionType: ActionType, programId: number | string): Promise<any> {
    return this.apiService
      .post(environment.url_121_service_api, `/actions/save`, {
        actionType,
        programId,
      })
      .toPromise();
  }

  retrieveLatestActions(
    actionType: ExportType | ActionType,
    programId: number | string,
  ): Promise<LatestAction> {
    return this.apiService
      .post(environment.url_121_service_api, `/actions/retrieve-latest`, {
        actionType,
        programId: Number(programId),
      })
      .toPromise();
  }

  addUser(
    email: string,
    password: string,
    roles: UserRole[] | string[],
  ): Promise<any> {
    return this.apiService
      .post(environment.url_121_service_api, `/user`, {
        email,
        password,
        roles,
      })
      .toPromise();
  }

  assignAidworker(
    programId: number | string,
    userId: number,
  ): Promise<Program> {
    return this.apiService
      .post(environment.url_121_service_api, `/user/${userId}/${programId}`, {})
      .toPromise();
  }

  getInstallmentsWithStateSums(programId: number | string): Promise<any> {
    return this.apiService
      .get(
        environment.url_121_service_api,
        `/programs/installment-state-sums/${programId}`,
      )
      .toPromise();
  }
}

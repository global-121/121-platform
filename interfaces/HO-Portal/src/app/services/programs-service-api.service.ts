import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { UserRole } from '../auth/user-role.enum';
import { ActionType } from '../models/action-type.model';
import { ExportType } from '../models/export-type.model';
import { InstallmentData } from '../models/installment.model';
import { Person } from '../models/person.model';
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

  advancePhase(programId: number, newState: string): Promise<any> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        `/programs/changeState/${programId}`,
        {
          newState,
        },
      )
      .toPromise();
  }

  getMetricsById(programId: number | string): Promise<ProgramMetrics> {
    return this.apiService
      .get(environment.url_121_service_api, `/programs/metrics/${programId}`)
      .toPromise();
  }

  getTotalIncluded(programId: number | string): Promise<number> {
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

  getTransaction(
    did: string,
    programId: number,
    installment: number,
    customDataKey: string,
    customDataValue: string,
  ): Promise<any> {
    return this.apiService
      .post(environment.url_121_service_api, `/programs/get-transaction`, {
        did,
        installment,
        programId,
        customDataKey,
        customDataValue,
      })
      .toPromise();
  }

  submitPayout(
    programId: number,
    installment: number,
    amount: number,
    did?: string,
  ): Promise<any> {
    return this.apiService
      .post(environment.url_121_service_api, `/programs/payout`, {
        programId,
        installment,
        amount,
        did,
      })
      .toPromise();
  }

  import(programId: number, file: File): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.apiService
      .post(
        environment.url_121_service_api,
        `/sovrin/create-connection/import-bulk/${programId}`,
        formData,
        false,
        false,
        true,
      )
      .toPromise();
  }

  exportList(
    programId: number,
    type: ExportType,
    installment?: number,
  ): Promise<any> {
    return this.apiService
      .post(environment.url_121_service_api, `/programs/export-list`, {
        programId,
        type,
        installment,
      })
      .toPromise();
  }

  exportVoucher(did: string, installment: number): Promise<Blob> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        `/fsp/intersolve/export-voucher`,
        {
          did,
          installment,
        },
        false,
        true,
      )
      .toPromise();
  }

  getBalance(did: string, installment: number): Promise<number> {
    return this.apiService
      .post(environment.url_121_service_api, `/fsp/intersolve/balance`, {
        did,
        installment,
      })
      .toPromise();
  }

  getPeopleAffected(programId: number | string): Promise<Person[]> {
    return this.apiService
      .get(environment.url_121_service_api, `/programs/enrolled/${programId}`)
      .toPromise();
  }

  getPeopleAffectedPrivacy(programId: number | string): Promise<Person[]> {
    return this.apiService
      .get(
        environment.url_121_service_api,
        `/programs/enrolledPrivacy/${programId}`,
      )
      .toPromise();
  }

  private updatePaStatus(
    action: string,
    programId: number | string,
    dids: string[],
    message?: string,
  ): Promise<any> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        `/programs/${action}/${programId}`,
        {
          dids: JSON.stringify(dids),
          message,
        },
      )
      .toPromise();
  }

  selectForValidation(
    programId: number | string,
    dids: string[],
  ): Promise<any> {
    return this.updatePaStatus('select-validation', programId, dids);
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
    dids: string[],
    message: string,
  ): Promise<any> {
    return this.updatePaStatus('include', programId, dids, message);
  }

  end(
    programId: number | string,
    dids: string[],
    message: string,
  ): Promise<any> {
    return this.updatePaStatus('end', programId, dids, message);
  }

  reject(
    programId: number | string,
    dids: string[],
    message: string,
  ): Promise<any> {
    return this.updatePaStatus('reject', programId, dids, message);
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
  ): Promise<any> {
    return this.apiService
      .post(environment.url_121_service_api, `/actions/retrieve-latest`, {
        actionType,
        programId,
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
}

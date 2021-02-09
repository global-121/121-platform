import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { UserRole } from '../auth/user-role.enum';
import { ActionType } from '../models/action-type.model';
import { ExportType } from '../models/export-type.model';
import { InstallmentData } from '../models/installment.model';
import { NotificationType } from '../models/notification-type.model';
import { Person } from '../models/person.model';
import { ProgramMetrics } from '../models/program-metrics.model';
import { Program } from '../models/program.model';
import { UserModel } from '../models/user.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class ProgramsServiceApiService {
  constructor(private apiService: ApiService) {}

  public login(email: string, password: string): Promise<UserModel | null> {
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

  deleteUser(userId: string): Promise<any> {
    return this.apiService
      .post(environment.url_121_service_api, '/user/delete/' + userId, {})
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
        `/programs/changeState/` + programId,
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
          return response.map((element) => {
            // Remap `installment`-property to `id`:
            element.id = element.installment;
            return element;
          });
        }),
      )
      .toPromise();
  }

  getTransactions(programId: number | string): Promise<any[]> {
    return this.apiService
      .get(
        environment.url_121_service_api,
        `/programs/transactions/${programId}`,
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

  exportPaymentList(programId: number, installment: number): Promise<any> {
    return this.apiService
      .post(environment.url_121_service_api, `/programs/payment-details`, {
        programId,
        installment,
      })
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

  selectForValidation(
    programId: number | string,
    dids: string[],
  ): Promise<any> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        `/programs/select-validation/${programId}`,
        {
          dids: JSON.stringify(dids),
        },
      )
      .toPromise();
  }

  include(programId: number | string, dids: string[]): Promise<any> {
    return this.apiService
      .post(environment.url_121_service_api, `/programs/include/${programId}`, {
        dids: JSON.stringify(dids),
      })
      .toPromise();
  }

  reject(
    programId: number | string,
    dids: string[],
    message: string,
  ): Promise<any> {
    return this.apiService
      .post(environment.url_121_service_api, `/programs/reject/${programId}`, {
        dids: JSON.stringify(dids),
        message,
      })
      .toPromise();
  }

  notifySelectedIncluded(
    programId: number | string,
    dids: string[],
  ): Promise<any> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        `/programs/notify-selected-included/${programId}`,
        {
          dids: JSON.stringify(dids),
        },
      )
      .toPromise();
  }

  notify(
    programId: number | string,
    notificationType: NotificationType,
  ): Promise<any> {
    return this.apiService
      .post(environment.url_121_service_api, `/programs/notify`, {
        programId,
        notificationType,
      })
      .toPromise();
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

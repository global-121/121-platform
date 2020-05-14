import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { ApiService } from './api.service';

import { Program } from '../models/program.model';
import { Person } from '../models/person.model';
import { PastInstallments } from '../models/past-installments.model';
import { ProgramMetrics } from '../models/program-metrics.model';

@Injectable({
  providedIn: 'root',
})
export class ProgramsServiceApiService {
  constructor(
    private apiService: ApiService,
  ) { }

  login(email: string, password: string): Observable<any> {
    console.log('ProgramsService : login()');

    return this.apiService.post(
      environment.url_121_service_api,
      '/user/login',
      {
        email,
        password
      },
      true
    );
  }

  deleteUser(userId: string): Promise<any> {
    return this.apiService.post(
      environment.url_121_service_api,
      '/user/delete/' + userId,
      {}
    ).toPromise();
  }

  getAllPrograms(): Promise<Program[]> {
    return this.apiService.get(
      environment.url_121_service_api,
      '/programs'
    ).pipe(
      map((response) => {
        return response.programs;
      })
    ).toPromise();
  }

  getProgramById(programId: number | string): Promise<Program> {
    return this.apiService.get(
      environment.url_121_service_api,
      `/programs/${programId}`,
    ).toPromise();
  }

  advancePhase(programId: number, newState: string): Promise<any> {
    return this.apiService.post(
      environment.url_121_service_api,
      `/programs/changeState/` + programId,
      {
        newState
      }
    ).toPromise();
  }

  getMetricsById(programId: number | string): Promise<ProgramMetrics> {
    return this.apiService.get(
      environment.url_121_service_api,
      `/programs/metrics/${programId}`,
    ).toPromise();
  }

  getTotalIncluded(programId: number | string): Promise<number> {
    return this.apiService.get(
      environment.url_121_service_api,
      `/programs/total-included/${programId}`,
    ).toPromise();
  }

  getPastInstallments(programId: number | string): Promise<PastInstallments[]> {
    return this.apiService.get(
      environment.url_121_service_api,
      `/programs/installments/${programId}`,
    ).toPromise();
  }

  submitPayout(programId: number, installment: number, amount: number): Promise<any> {
    return this.apiService.post(
      environment.url_121_service_api,
      `/programs/payout`,
      {
        programId,
        installment,
        amount,
      },
    ).toPromise();
  }

  exportList(programId: number, installment: number): Promise<any> {
    return this.apiService.post(
      environment.url_121_service_api,
      `/programs/payment-details`,
      {
        programId,
        installment,
      },
    ).toPromise();
  }

  getEnrolled(programId: number | string): Promise<Person[]> {
    return this.apiService.get(
      environment.url_121_service_api,
      `/programs/enrolled/${programId}`,
    ).toPromise();
  }

  getPeopleAffected(programId: number | string): Promise<Person[]> {
    return this.apiService.get(
      environment.url_121_service_api,
      `/programs/enrolled/${programId}`,
    ).toPromise();
  }

  getEnrolledPrivacy(programId: number | string): Promise<Person[]> {
    return this.apiService.get(
      environment.url_121_service_api,
      `/programs/enrolledPrivacy/${programId}`,
    ).toPromise();
  }

  selectForValidation(programId: number | string, dids: string[]): Promise<any> {
    return this.apiService.post(
      environment.url_121_service_api,
      `/programs/select-validation/${programId}`,
      {
        dids: JSON.stringify(dids),
      },
    ).toPromise();
  }

  include(programId: number | string, dids: string[]): Promise<any> {
    return this.apiService.post(
      environment.url_121_service_api,
      `/programs/include/${programId}`,
      {
        dids: JSON.stringify(dids),
      },
    ).toPromise();
  }

  exclude(programId: number | string, dids: string[]): Promise<any> {
    return this.apiService.post(
      environment.url_121_service_api,
      `/programs/exclude/${programId}`,
      {
        dids: JSON.stringify(dids),
      },
    ).toPromise();
  }

  addUser(email: string, password: string, role: string, status: string, countryId: number): Promise<any> {
    return this.apiService.post(
      environment.url_121_service_api,
      `/user`,
      {
        email,
        password,
        role,
        status,
        countryId
      },
    ).toPromise();
  }

  assignAidworker(programId: number | string, userId: number): Promise<Program> {
    return this.apiService.post(
      environment.url_121_service_api,
      `/user/${userId}/${programId}`,
      {}
    ).toPromise();
  }
}

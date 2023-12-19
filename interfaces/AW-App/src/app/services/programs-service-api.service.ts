import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { InstanceData } from '../models/instance.model';
import { ProgramAnswer } from '../models/pa-data.model';
import { Program, ProgramsDTO } from '../models/program.model';
import { User } from '../models/user.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class ProgramsServiceApiService {
  constructor(private apiService: ApiService) {}

  getInstanceInformation(): Promise<InstanceData> {
    return this.apiService
      .get(environment.url_121_service_api, '/instance')
      .toPromise();
  }

  login(username: string, password: string): Promise<User | null> {
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
      .pipe(
        map((response) => {
          if (response) {
            return {
              username: response.username,
              permissions: response.permissions,
              expires: response.expires,
            };
          }
          return null;
        }),
      )
      .toPromise();
  }

  logout(): Promise<null> {
    return this.apiService
      .post(environment.url_121_service_api, '/users/logout', {}, true)
      .toPromise();
  }

  changePassword(password: string): Promise<any> {
    return this.apiService
      .post(environment.url_121_service_api, '/users/password', {
        password,
      })
      .toPromise();
  }

  getProgramById(programId: number): Promise<Program> {
    return this.apiService
      .get(environment.url_121_service_api, '/programs/' + programId)
      .toPromise();
  }

  getAllAssignedPrograms(): Promise<ProgramsDTO> {
    return this.apiService
      .get(environment.url_121_service_api, '/programs/assigned/all', false)
      .toPromise();
  }

  getPaByPhoneNr(phoneNumber: string): Promise<any> {
    return this.apiService
      .get(
        environment.url_121_service_api,
        `/registrations/?phonenumber=${phoneNumber}`,
        false,
      )
      .toPromise();
  }

  getRegistration(referenceId: string): Promise<any> {
    return this.apiService
      .get(
        environment.url_121_service_api,
        `/registrations/${referenceId}`,
        false,
      )
      .toPromise();
  }

  getFspAttributesAnswers(
    referenceId: string,
    programId: number,
  ): Promise<any> {
    let params = new HttpParams();
    params = params.append('referenceId', referenceId);
    return this.apiService
      .get(
        environment.url_121_service_api,
        `/programs/${programId}/registrations/fsp-attributes/`,
        false,
        params,
      )
      .toPromise();
  }

  postRegistrationCustomAttribute(
    programId: number,
    referenceId: string,
    attribute: string,
    value: string | string[],
  ): Promise<any> {
    const data = {};
    data[attribute] = value;
    return this.apiService.patch(
      environment.url_121_service_api,
      `/programs/${programId}/registrations/${referenceId}`,
      {
        reason: 'Changed from field validation app.',
        data,
      },
      false,
    );
  }

  lookupPhoneNumber(phoneNumber: string): Promise<{ result: boolean }> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        '/notifications/lookup',
        {
          phoneNumber,
        },
        true,
      )
      .toPromise();
  }

  downloadData(): Promise<any> {
    return this.apiService
      .get(
        environment.url_121_service_api,
        '/registrations/download/validation-data',
      )
      .toPromise();
  }

  postValidationData(
    programId: number,
    referenceId: string,
    programAnswers: ProgramAnswer[],
  ): Promise<any> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        `/programs/${programId}/registrations/issue-validation`,
        {
          referenceId,
          programAnswers,
        },
      )
      .toPromise();
  }
}

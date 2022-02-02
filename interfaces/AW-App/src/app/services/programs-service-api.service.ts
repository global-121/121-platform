import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { InstanceData } from '../models/instance.model';
import { ProgramAnswer } from '../models/pa-data.model';
import { Program } from '../models/program.model';
import { UserModel } from '../models/user.model';
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

  login(username: string, password: string): Promise<UserModel> {
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
      .pipe(
        map((response) => {
          return {
            token: response.user.token,
          };
        }),
      )
      .toPromise();
  }

  changePassword(password: string): Promise<any> {
    return this.apiService
      .post(environment.url_121_service_api, '/user/change-password', {
        password,
      })
      .toPromise();
  }

  getProgramById(programId: number): Promise<Program> {
    return this.apiService
      .get(environment.url_121_service_api, '/programs/' + programId)
      .toPromise();
  }

  getReferenceIdByQrIdentifier(qrIdentifier: string): Promise<string> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        '/registrations/qr-find-reference-id',
        {
          qrIdentifier,
        },
        false,
      )
      .pipe(map((response) => response.referenceId))
      .toPromise();
  }

  getPaByPhoneNr(phoneNumber: string): Promise<any> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        '/registrations/search-name-phone',
        {
          phoneNumber,
        },
        false,
      )
      .toPromise();
  }

  getRegistration(referenceId: string): Promise<any> {
    return this.apiService
      .get(environment.url_121_service_api, '/registrations/get/' + referenceId)
      .toPromise();
  }

  getFspAttributesAsnwers(
    referenceId: string,
    programId: number,
  ): Promise<any> {
    return this.apiService
      .post(environment.url_121_service_api, '/registrations/get-fsp/', {
        referenceId,
        programId,
      })
      .toPromise();
  }

  postRegistrationCustomAttribute(
    referenceId: string,
    attribute: string,
    value: string,
  ): Promise<any> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        '/registrations/attribute',
        {
          referenceId,
          attribute,
          value,
        },
        false,
      )
      .toPromise();
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
    referenceId: string,
    programAnswers: ProgramAnswer[],
  ): Promise<any> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        '/registrations/issue-validation',
        {
          referenceId,
          programAnswers,
        },
      )
      .toPromise();
  }
}

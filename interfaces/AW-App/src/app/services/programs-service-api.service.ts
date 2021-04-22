import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { InstanceData } from '../models/instance.model';
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

  login(email: string, password: string): Promise<UserModel> {
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

  getConnectionByQrIdentifier(qrIdentifier: string): Promise<string> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        '/connection/qr-find-connection',
        {
          qrIdentifier,
        },
        false,
      )
      .pipe(map((response) => response.referenceId))
      .toPromise();
  }

  getPrefilledAnswers(referenceId: string, programId: number): Promise<any> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        '/connection/validation-data/get-answers/',
        {
          referenceId,
          programId,
        },
      )
      .toPromise();
  }

  getFspAttributesAsnwers(
    referenceId: string,
    programId: number,
  ): Promise<any> {
    return this.apiService
      .post(environment.url_121_service_api, '/connection/get-fsp/', {
        referenceId,
        programId,
      })
      .toPromise();
  }

  postConnectionCustomAttribute(
    referenceId: string,
    key: string,
    value: string,
  ): Promise<any> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        '/connection/custom-data',
        {
          referenceId,
          key,
          value,
        },
        true,
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
        '/connection/validation-data/download-data',
      )
      .toPromise();
  }

  issueCredential(
    referenceId: string,
    programId: number,
    attributes: any,
  ): Promise<any> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        '/connection/validation-data/issue',
        {
          referenceId,
          programId,
          attributes,
        },
      )
      .toPromise();
  }
}

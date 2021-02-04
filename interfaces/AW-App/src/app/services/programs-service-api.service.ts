import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Program } from '../models/program.model';
import { UserModel } from '../models/user.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class ProgramsServiceApiService {
  constructor(private apiService: ApiService) {}

  public login(email: string, password: string): Promise<UserModel> {
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

  public getDidByQrIdentifier(qrIdentifier: string): Promise<string> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        '/sovrin/create-connection/qr-find-did',
        {
          qrIdentifier,
        },
        false,
      )
      .pipe(map((response) => response.did))
      .toPromise();
  }

  getPrefilledAnswers(did: string, programId: number): Promise<any> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        '/sovrin/credential/get-answers/',
        {
          did,
          programId,
        },
      )
      .toPromise();
  }

  getFspAttributesAsnwers(did: string, programId: number): Promise<any> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        '/sovrin/create-connection/get-fsp/',
        {
          did,
          programId,
        },
      )
      .toPromise();
  }

  postConnectionCustomAttribute(
    did: string,
    key: string,
    value: string,
  ): Promise<any> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        '/sovrin/create-connection/custom-data/overwrite',
        {
          did,
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
      .get(environment.url_121_service_api, '/sovrin/credential/download-data')
      .toPromise();
  }

  issueCredential(
    did: string,
    programId: number,
    attributes: any,
  ): Promise<any> {
    return this.apiService
      .post(environment.url_121_service_api, '/sovrin/credential/issue', {
        did,
        programId,
        attributes,
      })
      .toPromise();
  }
}

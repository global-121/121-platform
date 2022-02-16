import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Fsp } from 'src/app/models/fsp.model';
import { InstanceData } from 'src/app/models/instance.model';
import { PaInclusionStates } from 'src/app/models/pa-statuses.enum';
import { Program } from 'src/app/models/program.model';
import { ApiService } from 'src/app/services/api.service';
import { environment } from 'src/environments/environment';
import { User } from '../models/user.model';

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

  getAllPrograms(): Promise<Program[]> {
    return this.apiService
      .get(environment.url_121_service_api, '/programs/published/all')
      .pipe(map((response) => response.programs))
      .toPromise();
  }

  getProgramById(programId: number): Promise<Program> {
    return this.apiService
      .get(environment.url_121_service_api, '/programs/' + programId)
      .toPromise();
  }

  getFspById(fspId: number): Promise<Fsp> {
    return this.apiService
      .get(environment.url_121_service_api, '/fsp/' + fspId)
      .toPromise();
  }

  createAccountPA(username: string, password: string): Promise<User | null> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        '/user/person-affected',
        {
          username,
          password,
        },
        true,
      )
      .toPromise();
  }

  login(username: string, password: string): Promise<User> {
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
      .toPromise();
  }

  logout(): Promise<null> {
    return this.apiService
      .post(environment.url_121_service_api, '/user/logout', {}, true)
      .toPromise();
  }

  deleteData(): Promise<any> {
    return this.apiService
      .post(environment.url_121_service_api, '/user/delete', {}, false)
      .toPromise();
  }

  store(type: string, data: string): Promise<any> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        '/people-affected/data-storage',
        {
          type,
          data,
        },
        false,
      )
      .toPromise();
  }

  retrieve(type: string): Promise<undefined | string | number | object> {
    return this.apiService
      .get(
        environment.url_121_service_api,
        '/people-affected/data-storage/' + type,
        false,
      )
      .pipe(
        map((value) => {
          let data;
          try {
            data = JSON.parse(value);
          } catch {
            data = value;
          }
          return data;
        }),
        catchError((error) => {
          if (error.error instanceof ErrorEvent) {
            // Client-side error:
            console.error(error);
          } else {
            // In case of server-side error (400/500):
            // Only on a 404-error, act as if nothing happened...
            if (error.status === 404) {
              return of(undefined);
            }
            // Otherwise...
            console.error(error);
            return of(error);
          }
        }),
      )
      .toPromise();
  }

  createRegistration(referenceId: string, programId: number): Promise<any> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        '/registrations',
        {
          referenceId,
          programId,
        },
        false,
      )
      .toPromise();
  }

  postProgramAnswers(referenceId: string, programAnswers: any): Promise<any> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        '/registrations/program-answers',
        {
          referenceId,
          programAnswers,
        },
        false,
      )
      .toPromise();
  }

  checkInclusionStatus(
    referenceId: string,
    programId: number,
  ): Observable<PaInclusionStates> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        '/registrations/inclusion-status/' + programId,
        {
          referenceId,
        },
        false,
      )
      .pipe(map((response) => response.status));
  }

  async postRegistration(referenceId: string): Promise<boolean> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        '/registrations/register',
        {
          referenceId,
        },
        false,
      )
      .toPromise()
      .then(() => true)
      .catch(() => false);
  }

  postRegistrationCustomAttribute(
    referenceId: string,
    key: string,
    value: string,
  ): Promise<any> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        '/registrations/custom-data',
        {
          referenceId,
          key,
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

  postPhoneNumber(
    referenceId: string,
    phoneNumber: string,
    language: string,
    useForInvitationMatching?: boolean,
  ): Promise<any> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        '/registrations/phone',
        {
          referenceId,
          phonenumber: phoneNumber,
          language,
          useForInvitationMatching,
        },
        false,
      )
      .toPromise();
  }

  postFsp(referenceId: string, fspId: number): Promise<any> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        '/registrations/fsp',
        {
          referenceId,
          fspId,
        },
        false,
      )
      .toPromise();
  }

  addQrIdentifier(referenceId: string, qrIdentifier: string): Promise<any> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        '/registrations/add-qr-identifier',
        {
          referenceId,
          qrIdentifier,
        },
        false,
      )
      .toPromise();
  }
}

import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Fsp } from 'src/app/models/fsp.model';
import { InstanceData } from 'src/app/models/instance.model';
import { Program, ProgramAttribute } from 'src/app/models/program.model';
import { ApiPath, ApiService } from 'src/app/services/api.service';
import { environment } from 'src/environments/environment';
import { User } from '../models/user.model';
import { SyncService } from './sync.service';

@Injectable({
  providedIn: 'root',
})
export class ProgramsServiceApiService {
  constructor(
    private apiService: ApiService,
    private syncService: SyncService,
  ) {}

  getInstanceInformation(): Promise<InstanceData> {
    return this.apiService
      .get(environment.url_121_service_api, '/instance')
      .toPromise();
  }

  getAllPrograms(programIdsToFilter?: number[]): Promise<Program[]> {
    return this.apiService
      .get(environment.url_121_service_api, '/programs/published/all')
      .pipe(
        map((response) => {
          if (!programIdsToFilter || programIdsToFilter.length === 0) {
            return response.programs;
          }
          return response.programs.filter((program: Program) =>
            programIdsToFilter.includes(program.id),
          );
        }),
      )
      .toPromise();
  }

  getProgramById(programId: number): Promise<Program> {
    return this.apiService
      .get(environment.url_121_service_api, '/programs/' + programId)
      .toPromise();
  }

  getFspById(fspId: number): Promise<Fsp> {
    return this.apiService
      .get(
        environment.url_121_service_api,
        '/financial-service-providers/' + fspId,
      )
      .toPromise();
  }

  createAccountPA(username: string, password: string): Promise<User | null> {
    return this.syncService
      .tryPost(environment.url_121_service_api, ApiPath.personAffected, {
        username,
        password,
      })
      .toPromise();
  }

  login(username: string, password: string): Promise<User> {
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
      .toPromise();
  }

  logout(completedRegistration: boolean): Promise<null> {
    return this.syncService
      .tryPost(environment.url_121_service_api, '/users/logout', {
        completedRegistration,
      })
      .toPromise();
  }

  deleteData(): Promise<any> {
    return this.apiService
      .delete(environment.url_121_service_api, '/users', {}, false)
      .toPromise();
  }

  store(type: string, data: string): Promise<any> {
    return this.syncService
      .tryPost(environment.url_121_service_api, ApiPath.dataStorage, {
        type,
        data,
      })
      .toPromise();
  }

  retrieve(type: string): Promise<undefined | string | number | object> {
    return this.apiService
      .get(
        environment.url_121_service_api,
        `${ApiPath.dataStorage}/${type}`,
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
            return null;
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
    return this.syncService
      .tryPost(
        environment.url_121_service_api,
        `${ApiPath.programsPrefix}${programId}${ApiPath.registrations}`,
        {
          referenceId,
          programId,
        },
      )
      .toPromise();
  }

  async postRegistration(
    referenceId: string,
    programId: number,
  ): Promise<boolean> {
    return this.syncService
      .tryPost(
        environment.url_121_service_api,
        `${ApiPath.programsPrefix}${programId}${ApiPath.register}`,
        {
          referenceId,
        },
      )
      .toPromise()
      .then((response) => {
        if (response && response.referenceId === referenceId) {
          return true;
        }
        return false;
      })
      .catch(() => false);
  }

  postRegistrationCustomAttributes(
    programAttributes: ProgramAttribute[],
    programId: number,
  ): Promise<any> {
    return this.syncService
      .tryPost(
        environment.url_121_service_api,
        `${ApiPath.programsPrefix}${programId}${ApiPath.customData}`,
        programAttributes,
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
    programId: number,
    useForInvitationMatching?: boolean,
  ): Promise<any> {
    return this.syncService
      .tryPost(
        `${environment.url_121_service_api}`,
        `${ApiPath.programsPrefix}${programId}${ApiPath.phoneNumber}`,
        {
          referenceId,
          phonenumber: phoneNumber,
          language,
          useForInvitationMatching,
        },
      )
      .toPromise();
  }

  postFsp(referenceId: string, fspId: number, programId: number): Promise<any> {
    return this.syncService
      .tryPost(
        `${environment.url_121_service_api}`,
        `${ApiPath.programsPrefix}${programId}${ApiPath.fsp}`,
        {
          referenceId,
          fspId,
        },
      )
      .toPromise();
  }

  isStatusRegistered(referenceId: string, programId: number): Promise<boolean> {
    return this.apiService
      .get(
        environment.url_121_service_api,
        `/programs/${programId}/registrations/status/${referenceId}`,
      )
      .toPromise()
      .then((res) => {
        return res.status === 'registered';
      })
      .catch(() => {
        return false;
      });
  }
}

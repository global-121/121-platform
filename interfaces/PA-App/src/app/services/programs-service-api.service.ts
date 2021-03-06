import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Fsp } from 'src/app/models/fsp.model';
import { InstanceData } from 'src/app/models/instance.model';
import { PaInclusionStates } from 'src/app/models/pa-statuses.enum';
import { Program } from 'src/app/models/program.model';
import { ApiService } from 'src/app/services/api.service';
import { environment } from 'src/environments/environment';

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

  createConnection(referenceId: string): Promise<any> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        '/connection',
        {
          referenceId,
        },
        true,
      )
      .toPromise();
  }

  postPrefilledAnswers(
    referenceId: string,
    programId: number,
    attributes: any,
  ): Promise<any> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        '/connection/validation-data/attributes',
        {
          referenceId,
          programId,
          attributes,
        },
        true,
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
        '/programs/inclusionStatus/' + programId,
        {
          referenceId,
        },
        true,
      )
      .pipe(map((response) => response.status));
  }

  async postConnectionApply(
    referenceId: string,
    programId: number,
  ): Promise<boolean> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        '/connection/apply-program/' + programId,
        {
          referenceId,
        },
        true,
      )
      .toPromise()
      .then(() => true)
      .catch(() => false);
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

  postPhoneNumber(
    referenceId: string,
    phoneNumber: string,
    language: string,
    useForInvitationMatching?: boolean,
  ): Promise<any> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        '/connection/phone',
        {
          referenceId,
          phonenumber: phoneNumber,
          language,
          useForInvitationMatching,
        },
        true,
      )
      .toPromise();
  }

  postFsp(referenceId: string, fspId: number): Promise<any> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        '/connection/fsp',
        {
          referenceId,
          fspId,
        },
        true,
      )
      .toPromise();
  }

  addQrIdentifier(referenceId: string, qrIdentifier: string): Promise<any> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        '/connection/add-qr-identifier',
        {
          referenceId,
          qrIdentifier,
        },
        true,
      )
      .toPromise();
  }

  deleteConnection(referenceId: string): Promise<any> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        '/connection/delete',
        {
          referenceId,
        },
        true,
      )
      .toPromise();
  }
}

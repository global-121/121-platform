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

  createConnection(did): Promise<any> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        '/sovrin/create-connection',
        {
          did,
        },
        true,
      )
      .toPromise();
  }

  postPrefilledAnswers(
    did: string,
    programId: number,
    credentialType: string,
    attributes: any,
  ): Promise<any> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        '/sovrin/credential/attributes',
        {
          did,
          programId,
          credentialType,
          attributes,
        },
        true,
      )
      .toPromise();
  }

  checkInclusionStatus(
    did: string,
    programId: number,
  ): Observable<PaInclusionStates> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        '/programs/inclusionStatus/' + programId,
        {
          did,
        },
        true,
      )
      .pipe(map((response) => response.status));
  }

  async postConnectionApply(did: string, programId: number): Promise<boolean> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        '/sovrin/create-connection/apply-program/' + programId,
        {
          did,
        },
        true,
      )
      .toPromise()
      .then(() => true)
      .catch(() => false);
  }

  postConnectionCustomAttribute(
    did: string,
    key: string,
    value: string,
  ): Promise<any> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        '/sovrin/create-connection/custom-data',
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

  postPhoneNumber(
    did: string,
    phoneNumber: string,
    language: string,
    useForInvitationMatching?: boolean,
  ): Promise<any> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        '/sovrin/create-connection/phone',
        {
          did,
          phonenumber: phoneNumber,
          language,
          useForInvitationMatching,
        },
        true,
      )
      .toPromise();
  }

  postFsp(did: string, fspId: number): Promise<any> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        '/sovrin/create-connection/fsp',
        {
          did,
          fspId,
        },
        true,
      )
      .toPromise();
  }

  addQrIdentifier(did: string, qrIdentifier: string): Promise<any> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        '/sovrin/create-connection/add-qr-identifier',
        {
          did,
          qrIdentifier,
        },
        true,
      )
      .toPromise();
  }

  deleteConnection(did: string): Promise<any> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        '/sovrin/create-connection/delete',
        {
          did,
        },
        true,
      )
      .toPromise();
  }
}

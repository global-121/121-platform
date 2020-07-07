import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Country } from '../models/country.model';
import { Fsp } from '../models/fsp.model';
import { Program } from '../models/program.model';
import { Timeslot } from '../models/timeslot.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class ProgramsServiceApiService {
  constructor(private apiService: ApiService) {}

  getCountries(): Promise<Country[]> {
    return this.apiService
      .get(environment.url_121_service_api, '/programs/countries/all')
      .toPromise();
  }

  getProgramsByCountryId(countryId: string): Promise<Program[]> {
    return this.apiService
      .get(environment.url_121_service_api, '/programs/country/' + countryId)
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
      .get(environment.url_121_service_api, '/programs/fsp/' + fspId)
      .toPromise();
  }

  getConnectionRequest(): Promise<any> {
    console.log('getConnectionRequest');
    return this.apiService
      .get(environment.url_121_service_api, '/sovrin/create-connection')
      .toPromise();
  }

  postConnectionResponse(
    did: string,
    verkey: string,
    nonce: string,
    meta: string,
  ): Promise<any> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        '/sovrin/create-connection',
        {
          did,
          verkey,
          nonce,
          meta,
        },
        true,
      )
      .toPromise();
  }

  getCredentialOffer(programId: number): Promise<any> {
    return this.apiService
      .get(
        environment.url_121_service_api,
        '/sovrin/credential/offer/' + programId,
      )
      .toPromise();
  }

  postCredentialRequest(
    did: string,
    programId: number,
    credentialRequest: string,
  ): Promise<any> {
    const encryptedCredentialRequest = JSON.stringify(credentialRequest);

    return this.apiService
      .post(
        environment.url_121_service_api,
        '/sovrin/credential/request',
        {
          did,
          programId,
          encryptedCredentialRequest,
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

  getCredential(did: string): Observable<any> {
    return this.apiService.post(
      environment.url_121_service_api,
      '/sovrin/credential/get',
      {
        did,
      },
      true,
    );
  }

  deleteCredential(did: string): Promise<any> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        '/sovrin/credential/delete',
        {
          did,
        },
        true,
      )
      .toPromise();
  }

  getProofRequest(programId: number): Promise<any> {
    return this.apiService
      .get(
        environment.url_121_service_api,
        '/sovrin/proof/proofRequest/' + programId,
      )
      .toPromise();
  }

  includeMe(
    did: string,
    programId: number,
    encryptedProof: string,
  ): Promise<any> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        '/programs/includeMe',
        {
          did,
          programId,
          encryptedProof,
        },
        true,
      )
      .pipe(map((response) => response.status))
      .toPromise();
  }

  checkInclusionStatus(did: string, programId: number): Observable<any> {
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

  getTimeslots(programId: number): Promise<Timeslot[]> {
    return this.apiService
      .get(
        environment.url_121_service_api,
        '/appointment/availability/' + programId,
      )
      .toPromise();
  }

  postAppointment(timeslotId: number, did: string): Promise<any> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        '/appointment/register/' + timeslotId,
        {
          did,
        },
        true,
      )
      .toPromise();
  }

  postConnectionApply(did: string, programId: number): Promise<any> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        '/sovrin/create-connection/apply-program/' + programId,
        {
          did,
        },
        true,
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
  ): Promise<any> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        '/sovrin/create-connection/phone',
        {
          did,
          phonenumber: phoneNumber,
          language,
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

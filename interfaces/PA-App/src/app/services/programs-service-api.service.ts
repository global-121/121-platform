import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { environment } from '../../environments/environment';

import { ApiService } from './api.service';

import { Country } from '../models/country.model';
import { Program } from '../models/program.model';
import { Timeslot } from '../models/timeslot.model';

@Injectable({
  providedIn: 'root'
})
export class ProgramsServiceApiService {
  constructor(
    private apiService: ApiService,
  ) { }

  getCountries(): Promise<Country[]> {
    return this.apiService
      .get(environment.url_121_service_api, '/programs/countries/all')
      .pipe(
        tap(response => console.log('response: ', response)),
        map(response => response)
      )
      .toPromise();
  }

  getAllPrograms(): Observable<Program[]> {
    return this.apiService
      .get(environment.url_121_service_api, '/programs')
      .pipe(
        tap(response => console.log('response: ', response)),
        map(response => response.programs)
      );
  }

  getProgramsByCountryId(countryId: string): Promise<Program[]> {
    return this.apiService
      .get(environment.url_121_service_api, '/programs/country/' + countryId)
      .pipe(
        tap(response => console.log('response: ', response)),
        map(response => response.programs)
      )
      .toPromise();
  }

  getProgramById(programId: number): Promise<Program> {
    return this.apiService
      .get(environment.url_121_service_api, '/programs/' + programId)
      .pipe(
        tap(response => console.log('response: ', response)),
        map(response => response)
      )
      .toPromise();
  }

  getConnectionRequest(): Promise<any> {
    console.log('getConnectionRequest');
    return this.apiService
      .get(
        environment.url_121_service_api,
        '/sovrin/create-connection'
      )
      .pipe(
        tap(response => console.log('response: ', response)),
        map(response => response)
      )
      .toPromise();
  }

  postConnectionResponse(did: string, verkey: string, nonce: string, meta: string): Promise<any> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        '/sovrin/create-connection',
        {
          did,
          verkey,
          nonce,
          meta
        },
        false
      ).pipe(
        tap(response => console.log('response: ', response)),
        map(response => response)
      )
      .toPromise();
  }

  getCredentialOffer(programId: number): Promise<any> {
    return this.apiService
      .get(
        environment.url_121_service_api,
        '/sovrin/credential/offer/' + programId
      )
      .pipe(
        tap(response => console.log('response: ', response)),
        map(response => response)
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
        false
      )
      .pipe(
        tap(response => console.log('response: ', response)),
        map(response => response)
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
          attributes
        },
        false
      )
      .pipe(
        tap(response => console.log('response: ', response)),
        map(response => response)
      )
      .toPromise();
  }

  getCredential(did: string): Observable<any> {
    return this.apiService
      .get(
        environment.url_121_service_api,
        '/sovrin/credential/' + did
      )
      .pipe(
        tap(response => console.log('response: ', response)),
        map(response => response)
      );
  }

  getProofRequest(programId: number): Promise<any> {
    return this.apiService
      .get(
        environment.url_121_service_api,
        '/sovrin/proof/proofRequest/' + programId
      )
      .pipe(
        tap(response => console.log('response: ', response)),
        map(response => response)
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
          encryptedProof
        },
        false
      )
      .pipe(
        tap(response => console.log('response: ', response)),
        map(response => response.status)
      )
      .toPromise();
  }

  checkInclusionStatus(
    did: string,
    programId: number,
  ): Promise<any> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        '/programs/inclusionStatus/' + programId,
        {
          did
        },
        false
      )
      .pipe(
        tap(response => console.log('response: ', response)),
        map(response => response.status)
      )
      .toPromise();
  }

  getTimeslots(programId: number): Promise<Timeslot[]> {
    return this.apiService.get(
      environment.url_121_service_api,
      '/appointment/availability/' + programId
    ).pipe(
      tap(response => console.log('response: ', response)),
      map(response => {

        return response;
      })
    )
      .toPromise();
  }

  postAppointment(timeslotId: number, did: string): Observable<any> {
    return this.apiService.post(
      environment.url_121_service_api,
      '/appointment/register/' + timeslotId,
      {
        did
      },
      true
    ).pipe(
      tap(response => console.log('response: ', response)),
      map(response => response)
    );
  }

  postPhoneNumber(did: string, phonenumber: string, language: string): Observable<any> {
    return this.apiService.post(
      environment.url_121_service_api,
      '/sovrin/create-connection/phone',
      {
        did,
        phonenumber,
        language
      },
      true
    ).pipe(
      tap(response => console.log('response: ', response)),
      map(response => response)
    );
  }
  deleteConnection(did: string): Observable<any> {
    return this.apiService.post(
      environment.url_121_service_api,
      '/sovrin/create-connection/delete',
      {
        did
      },
      true
    ).pipe(
      tap(response => console.log('response: ', response)),
      map(response => response)
    );
  }
}

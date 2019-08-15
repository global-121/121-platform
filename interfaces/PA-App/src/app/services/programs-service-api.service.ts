import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { ApiService } from './api.service';
import { JwtService } from './jwt.service';

import { Program } from '../models/program.model';
import { InclusionStatus } from '../models/inclusion-status.model';

@Injectable({
  providedIn: 'root'
})
export class ProgramsServiceApiService {
  constructor(private apiService: ApiService, private jwtService: JwtService) { }

  login(email: string, password: string): Observable<any> {
    console.log('ProgramsService : login()');

    return this.apiService
      .post(
        environment.url_121_service_api,
        '/user/login',
        {
          email,
          password
        },
        true
      )
      .pipe(
        map(response => {
          console.log('response: ', response);

          const user = response.user;

          if (user && user.token) {
            this.jwtService.saveToken(user.token);
          }
        })
      );
  }

  getCountries(): Observable<any[]> {
    return this.apiService
      .get(environment.url_121_service_api, '/programs/countries/all')
      .pipe(
        map(response => {
          // Somehow the endpoint gives no response (needs to be fixed in back-end)
          return response;
        })
      );
  }

  getAllPrograms(): Observable<Program[]> {
    return this.apiService
      .get(environment.url_121_service_api, '/programs')
      .pipe(
        map(response => {
          return response.programs;
        })
      );
  }

  getProgramsByCountryId(countryId: number): Observable<Program[]> {
    return this.apiService
      .get(environment.url_121_service_api, '/programs?countryId=' + countryId)
      .pipe(
        map(response => {
          return response.programs;
        })
      );
  }

  getInclusionStatus(programId: number, did: string): Observable<InclusionStatus> {
    return this.apiService
      .get(
        environment.url_121_service_api,
        '/programs/inclusionStatus/' + programId + '/' + did
      )
      .pipe(
        map(response => {
          return response;
        })
      );
  }

  getCredential(did: string): Observable<any> {
    console.log('getCredentials');
    return this.apiService
      .get(
        environment.url_121_service_api,
        '/sovrin/credential/' + did
      )
      .pipe(
        map(response => {
          console.log(response, 'map');
          return response;
        }),
      );
  }


  getTimeslots(programId: number): Observable<Program[]> {
    return this.apiService.get(
      environment.url_121_service_api,
      '/appointment/availability/' + programId
    ).pipe(
      map((response) => {
        return response;
      })
    );
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
      map((response) => {
        console.log('response: ', response);
      })
    );
  }
}

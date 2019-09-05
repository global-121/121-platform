import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { ApiService } from './api.service';
import { JwtService } from './jwt.service';

import { Program } from '../models/program.model';
import { InclusionStatus } from '../models/inclusion-status.model';
import { Timeslot } from '../models/timeslot.model';

@Injectable({
  providedIn: 'root'
})
export class ProgramsServiceApiService {
  constructor(
    private apiService: ApiService,
    private jwtService: JwtService
  ) { }

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
        tap(response => console.log('response: ', response)),
        map(response => {
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
        tap(response => console.log('response: ', response)),
        map(response => response)
      );
  }

  getAllPrograms(): Observable<Program[]> {
    return this.apiService
      .get(environment.url_121_service_api, '/programs')
      .pipe(
        tap(response => console.log('response: ', response)),
        map(response => response.programs)
      );
  }

  getProgramsByCountryId(countryId: string): Observable<Program[]> {
    return this.apiService
      .get(environment.url_121_service_api, '/programs?countryId=' + countryId)
      .pipe(
        tap(response => console.log('response: ', response)),
        map(response => response.programs)
      );
  }

  getProgramById(programId: string): Observable<Program> {
    return this.apiService
      .get(environment.url_121_service_api, '/programs/' + programId)
      .pipe(
        tap(response => console.log('response: ', response)),
        map(response => response)
      );
  }

  getInclusionStatus(programId: number, did: string): Observable<InclusionStatus> {
    return this.apiService
      .get(
        environment.url_121_service_api,
        '/programs/inclusionStatus/' + programId + '/' + did
      )
      .pipe(
        tap(response => console.log('response: ', response)),
        map(response => response)
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
        tap(response => console.log('response: ', response)),
        map(response => response)
      );
  }


  getTimeslots(programId: string): Observable<Timeslot[]> {
    return this.apiService.get(
      environment.url_121_service_api,
      '/appointment/availability/' + programId
    ).pipe(
      tap(response => console.log('response: ', response)),
      map(response => {
        // First 'unwrap' response:
        response = response[0];

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
      tap(response => console.log('response: ', response)),
      map(response => response)
    );
  }
}

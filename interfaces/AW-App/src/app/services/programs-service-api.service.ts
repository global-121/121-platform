import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { ApiService } from './api.service';
import { JwtService } from './jwt.service';

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

  getAppointments(): Observable<any> {
    return this.apiService.get(
      environment.url_121_service_api,
      '/appointment/appointments'
    ).pipe(
      tap(response => console.log('response: ', response)),
      map(response => response)
    );
  }

  getPrefilledAnswers(did: string, programId: number): Observable<any> {
    return this.apiService.get(
      environment.url_121_service_api,
      '/sovrin/credential/answers/'.concat(did, programId ? '?programId=' + programId : '')
    ).pipe(
      tap(response => console.log('response: ', response)),
      map(response => response)
    );
  }

  issueCredential(did: string, programId: number, credentialJson: any): Observable<any> {
    return this.apiService.post(
      environment.url_121_service_api,
      '/sovrin/credential/issue',
      {
        did,
        programId,
        credentialJson
      },
      false
    ).pipe(
      tap(response => console.log('response: ', response)),
      map(response => response)
    );
  }

  deletePrefilledAnswers(did: string, programId: number): Observable<any> {
    return this.apiService.delete(
      environment.url_121_service_api,
      '/sovrin/credential/answers/'.concat(did, programId ? '?programId=' + programId : ''),
      false
    ).pipe(
      tap(response => console.log('response: ', response)),
      map(response => response)
    );
  }

}

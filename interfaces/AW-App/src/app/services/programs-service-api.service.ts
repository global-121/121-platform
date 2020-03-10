import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { Program } from '../models/program.model';

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

  logout() {
    console.log('ProgramsService : logout()');
    this.jwtService.destroyToken();
  }

  changePassword(password: string): Observable<any> {
    return this.apiService.post(
      environment.url_121_service_api,
      '/user/change-password',
      {
        password
      },
      false
    ).pipe(
      tap(response => console.log('response: ', response)),
      map(response => response)
    );
  }

  getProgramById(programId: number): Promise<Program> {
    return this.apiService.get(
      environment.url_121_service_api,
      '/programs/' + programId
    ).pipe(
      tap(response => console.log('response: ', response)),
      map(response => response)
    )
      .toPromise();
  }

  getAppointments(): Promise<any> {
    return this.apiService.get(
      environment.url_121_service_api,
      '/appointment/appointments'
    ).pipe(
      tap(response => console.log('response: ', response)),
      map(response => response)
    )
      .toPromise();
  }

  getPrefilledAnswers(did: string, programId: number): Observable<any> {
    return this.apiService.post(
      environment.url_121_service_api,
      '/sovrin/credential/get-answers/',
      {
        did,
        programId
      }
    ).pipe(
      tap(response => console.log('response: ', response)),
      map(response => response)
    );
  }

  issueCredential(did: string, programId: number): Observable<any> {
    return this.apiService.post(
      environment.url_121_service_api,
      '/sovrin/credential/issue',
      {
        did,
        programId
      },
      false
    ).pipe(
      tap(response => console.log('response: ', response)),
      map(response => response)
    );
  }

  deletePrefilledAnswers(did: string, programId: number): Observable<any> {
    return this.apiService.post(
      environment.url_121_service_api,
      '/sovrin/credential//delete-answers',
      {
        did,
        programId
      }
    ).pipe(
      tap(response => console.log('response: ', response)),
      map(response => response)
    );
  }

}

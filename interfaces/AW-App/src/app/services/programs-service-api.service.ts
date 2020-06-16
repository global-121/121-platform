import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { Program } from '../models/program.model';

import { environment } from '../../environments/environment';
import { ApiService } from './api.service';
import { JwtService } from './jwt.service';

@Injectable({
  providedIn: 'root',
})
export class ProgramsServiceApiService {
  constructor(private apiService: ApiService, private jwtService: JwtService) {}

  // login(email: string, password: string): Promise<any> {
  //   console.log('ProgramsService : login()');

  //   return this.apiService
  //     .post(
  //       environment.url_121_service_api,
  //       '/user/login',
  //       {
  //         email,
  //         password,
  //       },
  //       true,
  //     )
  //     .pipe(
  //       map((response) => {
  //         const user = response.user;

  //         if (user && user.token) {
  //           this.jwtService.saveToken(user.token);
  //         }
  //       }),
  //     )
  //     .toPromise();
  // }

  login(email: string, password: string): Observable<any> {
    console.log('ProgramsService : login()');

    return this.apiService.post(
      environment.url_121_service_api,
      '/user/login',
      {
        email,
        password,
      },
      true,
    );
  }

  logout() {
    console.log('ProgramsService : logout()');
    this.jwtService.destroyToken();
  }

  changePassword(password: string): Promise<any> {
    return this.apiService
      .post(environment.url_121_service_api, '/user/change-password', {
        password,
      })
      .toPromise();
  }

  getProgramById(programId: number): Promise<Program> {
    return this.apiService
      .get(environment.url_121_service_api, '/programs/' + programId)
      .toPromise();
  }

  getAppointments(): Promise<any> {
    return this.apiService
      .get(environment.url_121_service_api, '/appointment/appointments')
      .toPromise();
  }

  public getDidByQrIdentifier(qrIdentifier: string): Promise<string> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        '/sovrin/create-connection/qr-find-did',
        {
          qrIdentifier,
        },
        false,
      )
      .pipe(map((response) => response.did))
      .toPromise();
  }

  getPrefilledAnswers(did: string, programId: number): Promise<any> {
    return this.apiService
      .post(
        environment.url_121_service_api,
        '/sovrin/credential/get-answers/',
        {
          did,
          programId,
        },
      )
      .toPromise();
  }

  downloadData(): Promise<any> {
    return this.apiService
      .get(environment.url_121_service_api, '/sovrin/credential/download-data')
      .toPromise();
  }

  issueCredential(
    did: string,
    programId: number,
    attributes: any,
  ): Promise<any> {
    return this.apiService
      .post(environment.url_121_service_api, '/sovrin/credential/issue', {
        did,
        programId,
        attributes,
      })
      .toPromise();
  }
}

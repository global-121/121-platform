import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

import { environment } from '../../environments/environment';
import { JwtService } from './jwt.service';

import mockPrograms from '../mocks/programs.mock';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(
    private jwtService: JwtService,
    private http: HttpClient,
  ) { }

  private getApiUrl(serviceName: string): string {
    const services = {
      'programs-service': environment.programs_service_api,
    };
    const apiUrl = services[serviceName];

    return apiUrl;
  }

  private setHeaders(): HttpHeaders {
    const headersConfig = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Token ${this.jwtService.getToken()}`,
    };

    return new HttpHeaders(headersConfig);
  }

  get(
    serviceName: string,
    path: string
  ): Observable<any> {
    console.log(`ApiService GET: ${serviceName} : ${path}`);

    const apiUrl = this.getApiUrl(serviceName);

    // Add 'fallback' for tests
    if (apiUrl === '' && serviceName === 'programs-service') {
      return of(mockPrograms);
    }

    return this.http.get(
      apiUrl + path,
      {
        headers: this.setHeaders(),
      }
    );
  }
}

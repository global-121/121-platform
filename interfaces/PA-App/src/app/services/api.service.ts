import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import InterfaceName from '../enums/interface-names.enum';

export enum ApiPath {
  programsPrefix = '/programs/',
  customData = '/registrations/custom-data',
  dataStorage = '/people-affected/data-storage',
  fsp = '/registrations/fsp',
  personAffected = '/users/person-affected',
  phoneNumber = '/registrations/phone',
  registrations = '/registrations',
  logout = '/users/logout',
  register = '/registrations/register',
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(private http: HttpClient) {}

  private showSecurity(anonymous: boolean) {
    return anonymous ? '🌐' : '🔐';
  }

  private createHeaders(): HttpHeaders {
    return new HttpHeaders({
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-121-Interface': InterfaceName.paApp,
    });
  }

  get(
    endpoint: string,
    path: string,
    anonymous = true,
  ): Observable<any> {
    const security = this.showSecurity(anonymous);
    console.log(`ApiService GET: ${security} ${endpoint}${path}`);

    return this.http
      .get(endpoint + path, {
        headers: this.createHeaders(),
        withCredentials: true,
      })
      .pipe(
        tap((response) =>
          console.log(
            `ApiService GET: ${security} ${endpoint}${path}`,
            `\nResponse:`,
            response,
          ),
        ),
      );
  }

  post(
    endpoint: string,
    path: ApiPath | string,
    body: object,
    anonymous = false,
  ): Observable<any> {
    const security = this.showSecurity(anonymous);
    console.log(`ApiService POST: ${security} ${endpoint}${path}`, body);

    return this.http
      .post(endpoint + path, body, {
        headers: this.createHeaders(),
        withCredentials: true,
      })
      .pipe(
        tap((response) =>
          console.log(
            `ApiService POST: ${security} ${endpoint}${path}:`,
            body,
            `\nResponse:`,
            response,
          ),
        ),
      );
  }

  delete(
    endpoint: string,
    path: ApiPath | string,
    body?: object,
    anonymous = false,
  ): Observable<any> {
    const security = this.showSecurity(anonymous);

    return this.http
      .delete(endpoint + path, {
        headers: this.createHeaders(),
        withCredentials: true,
        body: body,
      })
      .pipe(
        tap((response) =>
          console.log(
            `ApiService DELETE: ${security} ${endpoint}${path}`,
            '\nResponse:',
            response,
          ),
        ),
      );
  }
}

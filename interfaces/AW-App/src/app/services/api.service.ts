import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpParams,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import InterfaceName from '../enums/interface-names.enum';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private userKey = 'logged-in-user-AW';

  constructor(private http: HttpClient) {}

  private showSecurity(anonymous: boolean) {
    return anonymous ? '🌐' : '🔐';
  }

  private createHeaders(isUpload: boolean = false): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-121-Interface': InterfaceName.awApp,
    });

    if (isUpload) {
      headers = headers.delete('Content-Type');
    }

    return headers;
  }

  get(
    endpoint: string,
    path: string,
    anonymous: boolean = false,
    params: HttpParams = null,
  ): Observable<any> {
    const security = this.showSecurity(anonymous);
    console.log(`ApiService GET: ${security} ${endpoint}${path}`);

    return this.http
      .get(endpoint + path, {
        headers: this.createHeaders(),
        withCredentials: true,
        params,
      })
      .pipe(
        tap((response) =>
          console.log(
            `ApiService GET: ${security} ${endpoint}${path}${
              params ? `\nParams ${params}` : ''
            }`,
            `\nResponse:`,
            response,
          ),
        ),
        catchError((error: HttpErrorResponse): Observable<any> => {
          return this.handleError(error, anonymous);
        }),
      );
  }

  post(
    endpoint: string,
    path: string,
    body: object,
    anonymous: boolean = false,
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
        catchError((error: HttpErrorResponse): Observable<any> => {
          return this.handleError(error, anonymous);
        }),
      );
  }

  patch(
    endpoint: string,
    path: string,
    body: object,
    anonymous: boolean = false,
    responseAsBlob: boolean = false,
    isUpload: boolean = false,
  ): Promise<any> {
    const security = this.showSecurity(anonymous);
    console.log(`ApiService PATCH: ${security} ${endpoint}${path}`, body);

    return new Promise((resolve, reject) =>
      this.http
        .patch(endpoint + path, body, {
          headers: this.createHeaders(isUpload),
          responseType: responseAsBlob ? 'blob' : null,
          withCredentials: true,
        })
        .pipe(
          tap((response) =>
            console.log(
              `ApiService PATCH: ${security} ${endpoint}${path}:`,
              body,
              '\nResponse:',
              response,
            ),
          ),
          catchError(
            (error: HttpErrorResponse): Observable<any> =>
              this.handleError(error, anonymous),
          ),
        )
        .toPromise()
        .then((response) => {
          if (response && response.error) {
            throw response;
          }
          return resolve(response);
        })
        .catch((err) => reject(err)),
    );
  }

  handleError(error: HttpErrorResponse, anonymous: boolean) {
    if (anonymous === true) {
      return of(error);
    }
    if (error.status === 401) {
      const rawUser = localStorage.getItem(this.userKey);
      if (!rawUser) {
        return of(error);
      }

      const user: User = JSON.parse(rawUser);
      const expires = Date.parse(user.expires);
      if (expires < Date.now()) {
        localStorage.removeItem(this.userKey);
        window.location.reload();
        return of('Token expired');
      }
    }
  }
}

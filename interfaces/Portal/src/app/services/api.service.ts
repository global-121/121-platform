import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpParams,
  HttpStatusCode,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { USER_KEY } from '../auth/auth.service';
import InterfaceName from '../enums/interface-names.enum';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private isRateLimitErrorShown = false;

  constructor(private http: HttpClient) {}

  private showSecurity(anonymous: boolean) {
    return anonymous ? '🌐' : '🔐';
  }

  private createHeaders(isUpload = false): HttpHeaders {
    let headers = new HttpHeaders({
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-121-Interface': InterfaceName.portal,
    });

    if (isUpload) {
      headers = headers.delete('Content-Type');
    }

    return headers;
  }

  get(
    endpoint: string,
    path: string,
    anonymous = false,
    responseAsBlob = false,
    params = null,
  ): Promise<any> {
    const security = this.showSecurity(anonymous);

    return new Promise((resolve, reject) =>
      this.http
        .get(endpoint + path, {
          headers: this.createHeaders(),
          responseType: responseAsBlob ? 'blob' : null,
          withCredentials: true,
          params,
        })
        .pipe(
          tap((response) =>
            console.log(
              `ApiService GET: ${security} ${endpoint}${path}${
                params ? `\nParams ${params}` : ''
              }`,
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

  post(
    endpoint: string,
    path: string,
    body: object,
    anonymous = false,
    responseAsBlob = false,
    isUpload = false,
    params: HttpParams = null,
  ): Promise<any> {
    const security = this.showSecurity(anonymous);
    console.log(`ApiService POST: ${security} ${endpoint}${path}`, body);

    return new Promise((resolve, reject) =>
      this.http
        .post(endpoint + path, body, {
          headers: this.createHeaders(isUpload),
          responseType: responseAsBlob ? 'blob' : undefined,
          withCredentials: true,
          params,
        })
        .pipe(
          tap((response) =>
            console.log(
              `ApiService POST: ${security} ${endpoint}${path}${
                params ? `\nParams ${params}` : ''
              }:`,
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

  put(
    endpoint: string,
    path: string,
    body: object,
    anonymous = false,
    responseAsBlob = false,
    isUpload = false,
  ): Promise<any> {
    const security = this.showSecurity(anonymous);
    console.log(`ApiService PUT: ${security} ${endpoint}${path}`, body);

    return new Promise((resolve, reject) =>
      this.http
        .put(endpoint + path, body, {
          headers: this.createHeaders(isUpload),
          responseType: responseAsBlob ? 'blob' : null,
          withCredentials: true,
        })
        .pipe(
          tap((response) =>
            console.log(
              `ApiService PUT: ${security} ${endpoint}${path}:`,
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

  patch(
    endpoint: string,
    path: string,
    body: object,
    anonymous = false,
    responseAsBlob = false,
    isUpload = false,
    params: HttpParams = null,
  ): Promise<any> {
    const security = this.showSecurity(anonymous);
    console.log(`ApiService PATCH: ${security} ${endpoint}${path}`, body);

    return new Promise((resolve, reject) =>
      this.http
        .patch(endpoint + path, body, {
          headers: this.createHeaders(isUpload),
          responseType: responseAsBlob ? 'blob' : null,
          withCredentials: true,
          params,
        })
        .pipe(
          tap((response) =>
            console.log(
              `ApiService PATCH: ${security} ${endpoint}${path}${
                params ? `\nParams ${params}` : ''
              }:`,
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

  delete(
    endpoint: string,
    path: string,
    body?: object,
    anonymous = false,
    params: HttpParams = null,
  ): Promise<any> {
    const security = this.showSecurity(anonymous);

    return new Promise((resolve, reject) =>
      this.http
        .delete(endpoint + path, {
          headers: this.createHeaders(),
          withCredentials: true,
          body: body,
          params,
        })
        .pipe(
          tap((response) =>
            console.log(
              `ApiService DELETE: ${security} ${endpoint}${path}${
                params ? `\nParams ${params}` : ''
              }`,
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
    if (
      error.status === HttpStatusCode.TooManyRequests &&
      !this.isRateLimitErrorShown
    ) {
      this.isRateLimitErrorShown = true;
      window.alert('Rate limit exceeded. Please try again later.');
      this.isRateLimitErrorShown = false;
      return of('Rate limit exceeded');
    }

    if (anonymous === true) {
      return of(error);
    }

    if (error.status === HttpStatusCode.Unauthorized) {
      localStorage.removeItem(USER_KEY);
      window.location.reload();

      const rawUser = localStorage.getItem(USER_KEY);

      if (!rawUser) {
        return of(error);
      }

      const user: User = JSON.parse(rawUser);
      const expires = Date.parse(user.expires);

      if (expires < Date.now()) {
        localStorage.removeItem(USER_KEY);
        window.location.reload();
        return of('Token expired');
      }

      return of('Not authorized');
    }
    return of(error);
  }
}

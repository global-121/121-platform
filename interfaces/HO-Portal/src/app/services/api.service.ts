import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private userKey = 'logged-in-user-HO';

  constructor(private http: HttpClient) {}

  private showSecurity(anonymous: boolean) {
    return anonymous ? '🌐' : '🔐';
  }

  private createHeaders(isUpload: boolean = false): HttpHeaders {
    let headers = new HttpHeaders({
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-121-Interface': 'portal',
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
  ): Observable<any> {
    const security = this.showSecurity(anonymous);

    return this.http
      .get(endpoint + path, {
        headers: this.createHeaders(anonymous),
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
    responseAsBlob: boolean = false,
    isUpload: boolean = false,
  ): Observable<any> {
    const security = this.showSecurity(anonymous);
    console.log(`ApiService POST: ${security} ${endpoint}${path}`, body);

    return this.http
      .post(endpoint + path, body, {
        headers: this.createHeaders(isUpload),
        responseType: responseAsBlob ? 'blob' : null,
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

  handleError(error: HttpErrorResponse, anonymous: boolean) {
    if (anonymous === true) {
      throwError(error);
    }
    if (error.status === 401) {
      const rawUser = localStorage.getItem(this.userKey);
      if (!rawUser) {
        throwError(error);
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

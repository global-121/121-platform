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
  private userKey = 'logged-in-user-AW';

  constructor(private http: HttpClient) {}

  private showSecurity(anonymous: boolean) {
    return anonymous ? '🌐' : '🔐';
  }

  private createHeaders(): HttpHeaders {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-121-Interface': 'AW-app',
    });

    return headers;
  }

  get(
    endpoint: string,
    path: string,
    anonymous: boolean = false,
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

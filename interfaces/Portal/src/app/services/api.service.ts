import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpParams,
  HttpStatusCode,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom, Observable, of } from 'rxjs';
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

  private async performRequest(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    url: string,
    {
      anonymous = false,
      body,
      responseAsBlob = false,
      isUpload = false,
      params,
    }: {
      anonymous?: boolean;
      body?: unknown;
      responseAsBlob?: boolean;
      isUpload?: boolean;
      params?: HttpParams;
    },
  ) {
    const security = this.showSecurity(anonymous);
    console.log(`ApiService ${method}: ${security} ${url}`, body);

    try {
      const response = await lastValueFrom(
        this.http
          .request(method, url, {
            headers: this.createHeaders(isUpload),
            responseType: responseAsBlob ? 'blob' : undefined,
            withCredentials: true,
            params,
            body,
          })
          .pipe(
            tap((response) =>
              console.log(
                `ApiService ${method}: ${security} ${url}${
                  params ? `\nParams ${params}` : ''
                }${body ? `\nBody: ${JSON.stringify(body, null, 2)}` : ''}`,
                '\nResponse:',
                response,
              ),
            ),
            catchError((error: HttpErrorResponse): Observable<any> => {
              return this.handleError(error, anonymous);
            }),
          ),
      );
      if (response && response.error) {
        throw response;
      }
      return response;
    } catch (error) {
      console.error(`Error in ApiService ${method}:`, error);
      throw error;
    }
  }

  get(
    endpoint: string,
    path: string,
    anonymous = false,
    responseAsBlob = false,
    params = null,
  ): Promise<any> {
    return this.performRequest('GET', endpoint + path, {
      anonymous,
      responseAsBlob,
      params,
    });
  }

  post(
    endpoint: string,
    path: string,
    body: unknown,
    anonymous = false,
    responseAsBlob = false,
    isUpload = false,
    params: HttpParams = null,
  ): Promise<any> {
    return this.performRequest('POST', endpoint + path, {
      anonymous,
      responseAsBlob,
      params,
      body,
      isUpload,
    });
  }

  put(endpoint: string, path: string, body: unknown): Promise<any> {
    return this.performRequest('PUT', endpoint + path, {
      body,
    });
  }

  patch(
    endpoint: string,
    path: string,
    body: unknown,
    responseAsBlob = false,
    isUpload = false,
    params: HttpParams = null,
  ): Promise<any> {
    return this.performRequest('PATCH', endpoint + path, {
      body,
      responseAsBlob,
      isUpload,
      params,
    });
  }

  delete(
    endpoint: string,
    path: string,
    body?: unknown,
    params?: HttpParams,
  ): Promise<any> {
    return this.performRequest('DELETE', endpoint + path, {
      body,
      params,
    });
  }

  private handleError(error: HttpErrorResponse, anonymous = false) {
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
      const rawUser = localStorage.getItem(USER_KEY);

      if (!rawUser) {
        return of(error);
      }

      const user: User = JSON.parse(rawUser);
      const expires = Date.parse(user.expires);

      if (expires < Date.now()) {
        return of('Token expired');
      }

      return of('Not authorized');
    }
    return of(error);
  }
}

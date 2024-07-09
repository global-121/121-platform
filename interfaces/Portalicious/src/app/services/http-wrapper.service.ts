import { InterfaceNames } from '@121-service/src/shared/enum/interface-names.enum';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpParams,
  HttpStatusCode,
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { lastValueFrom, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { User } from '~/models/user.model';
import { environment } from '~environment';

interface PerformRequestParams {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  body?: unknown;
  responseAsBlob?: boolean;
  isUpload?: boolean;
  params?: HttpParams;
}

@Injectable({
  providedIn: 'root',
})
export class HttpWrapperService {
  private http = inject(HttpClient);
  private isRateLimitErrorShown = false;

  private createHeaders(isUpload = false): HttpHeaders {
    let headers = new HttpHeaders({
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-121-Interface': InterfaceNames.portal,
    });

    if (isUpload) {
      headers = headers.delete('Content-Type');
    }

    return headers;
  }

  private handleError(error: HttpErrorResponse) {
    if (
      // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
      error.status === HttpStatusCode.TooManyRequests &&
      !this.isRateLimitErrorShown
    ) {
      this.isRateLimitErrorShown = true;
      window.alert('Rate limit exceeded. Please try again later.');
      this.isRateLimitErrorShown = false;
      return of(new Error('Rate limit exceeded'));
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    if (error.status === HttpStatusCode.Unauthorized) {
      // XXX: eventually this should be replaced with the USER_KEY exported by the AuthService
      const rawUser = localStorage.getItem('USER_KEY');

      if (!rawUser) {
        return of(error);
      }

      const user = JSON.parse(rawUser) as User;

      if (user.expires) {
        const expires = Date.parse(user.expires);

        if (expires < Date.now()) {
          return of(new Error('Token expired'));
        }
      }

      return of(new Error('Not authorized'));
    }
    return of(error);
  }

  public async performRequest<T>({
    method,
    url,
    body,
    responseAsBlob = false,
    isUpload = false,
    params,
  }: PerformRequestParams): Promise<T> {
    console.log(`HttpWrapperService ${method}: ${url}`, body ?? '');

    try {
      const response = await lastValueFrom<T | HttpErrorResponse | Error>(
        this.http
          .request(method, url, {
            headers: this.createHeaders(isUpload),
            responseType: responseAsBlob ? 'blob' : undefined,
            withCredentials: true,
            params,
            body,
          })
          .pipe(
            tap((response) => {
              console.log(
                `HttpWrapperService ${method}: ${url}${
                  params ? `\nParams ${params.toString()}` : ''
                }${body ? `\nBody: ${JSON.stringify(body, null, 2)}` : ''}`,
                '\nResponse:',
                response,
              );
            }),
            catchError((error: HttpErrorResponse) => {
              return this.handleError(error);
            }),
          ),
      );
      if (response instanceof Error || response instanceof HttpErrorResponse) {
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw response;
      }

      return response;
    } catch (error) {
      console.error(`Error in HttpWrapperService ${method}:`, error);
      throw error;
    }
  }

  public async perform121ServiceRequest<T>(
    options: Omit<PerformRequestParams, 'url'> & { endpoint: string },
  ): Promise<T> {
    return this.performRequest<T>({
      ...options,
      url: `${environment.url_121_service_api}/${options.endpoint}`,
    });
  }
}

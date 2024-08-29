import { InterfaceNames } from '@121-service/src/shared/enum/interface-names.enum';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpParams,
  HttpStatusCode,
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { get } from 'lodash';
import { lastValueFrom, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { getUserFromLocalStorage } from '~/services/auth.service';
import { environment } from '~environment';

interface PerformRequestParams {
  method: 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';
  url: string;
  body?: unknown;
  responseAsBlob?: boolean;
  isUpload?: boolean;
  params?:
    | HttpParams
    | Record<
        string,
        boolean | number | readonly (boolean | number | string)[] | string
      >;
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
      window.alert(
        $localize`:@@error-rate-limit:Rate limit exceeded. Please try again later.`,
      );
      this.isRateLimitErrorShown = false;
      return of(
        new Error(
          $localize`:@@error-rate-limit:Rate limit exceeded. Please try again later.`,
        ),
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    if (error.status === HttpStatusCode.Unauthorized) {
      const user = getUserFromLocalStorage();

      if (!user) {
        return of(error);
      }

      if (user.expires) {
        const expires = Date.parse(user.expires);

        if (expires < Date.now()) {
          return of(new Error($localize`:@@error-token-expired:Token expired`));
        }
      }
    }

    let errorMessage = get(error.error, 'message') as string | undefined;

    const errors: unknown = get(error, 'error.errors');
    if (errors) {
      let errorArray: unknown[] = [];

      if (typeof errors === 'string') {
        errorArray = [errors];
      } else if (Array.isArray(errors) && errors.length > 0) {
        errorArray = errors;
      }

      if (errorArray.length > 0) {
        errorMessage = errorArray
          .map((err) => {
            if (typeof err !== 'string') {
              return err;
            }

            try {
              const text = JSON.parse(err) as { detail?: string };
              return text.detail ?? err;
            } catch {
              return err;
            }
          })
          .join(' - ');
      }
    }

    if (errorMessage) {
      return of(
        new Error(
          $localize`:@@generic-error-with-message:Something went wrong: ${errorMessage}`,
        ),
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    if (error.status === HttpStatusCode.InternalServerError) {
      return of(
        new Error(
          $localize`:@@generic-error-try-again:An unexpected error has occurred. Please try again later.`,
        ),
      );
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
      const response = await lastValueFrom<Error | HttpErrorResponse | T>(
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
                  params ? `\nParams ${JSON.stringify(params, null, 2)}` : ''
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
    options: { endpoint: string } & Omit<PerformRequestParams, 'url'>,
  ): Promise<T> {
    return this.performRequest<T>({
      ...options,
      url: `${environment.url_121_service_api}/${options.endpoint}`,
    });
  }
}

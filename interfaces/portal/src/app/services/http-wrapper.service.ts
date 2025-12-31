import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpParams,
  HttpParamsOptions,
  HttpStatusCode,
} from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { get } from 'radashi';
import { lastValueFrom, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import {
  INTERFACE_NAME_HEADER,
  InterfaceNames,
} from '@121-service/src/shared/enum/interface-names.enum';

import { getUserFromLocalStorage } from '~/utils/local-storage';
import { environment } from '~environment';

interface PerformRequestParams {
  method: 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';
  url: string;
  body?: unknown;
  responseAsBlob?: boolean;
  isUpload?: boolean;
  httpParams?: HttpParamsOptions['fromObject'];
}

export type Perform121ServiceRequestParams = { endpoint: string } & Omit<
  PerformRequestParams,
  'url'
>;

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
      [INTERFACE_NAME_HEADER]: InterfaceNames.portal,
    });

    if (isUpload) {
      headers = headers.delete('Content-Type');
    }

    return headers;
  }

  private handleError(errorResponse: HttpErrorResponse) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison -- HttpStatusCode is a number enum
    if (errorResponse.status === HttpStatusCode.InternalServerError) {
      return of(
        new Error(
          $localize`:@@generic-error-try-again:An unexpected error has occurred. Please try again later.`,
          {
            cause: errorResponse,
          },
        ),
      );
    }

    if (
      // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison -- HttpStatusCode is a number enum
      errorResponse.status === HttpStatusCode.TooManyRequests &&
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
          {
            cause: errorResponse,
          },
        ),
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison -- HttpStatusCode is a number enum
    if (errorResponse.status === HttpStatusCode.Unauthorized) {
      const user = getUserFromLocalStorage();

      if (!user) {
        return of(errorResponse);
      }

      if (user.expires) {
        const expires = Date.parse(user.expires);

        if (expires < Date.now()) {
          return of(
            new Error($localize`:@@error-token-expired:Token expired`, {
              cause: errorResponse,
            }),
          );
        }
      }
    }

    let errorMessage = get(errorResponse.error, 'message');

    const errors: unknown = get(errorResponse, 'error.errors');
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
          $localize`:@@generic-error-with-message:Something went wrong: ${JSON.stringify(errorMessage)}:errorMessage:`,
          {
            cause: errorResponse,
          },
        ),
      );
    }

    return of(
      new Error($localize`:@@generic-error:Something went wrong`, {
        cause: errorResponse,
      }),
    );
  }

  public async performRequest<T>({
    method,
    url,
    body,
    responseAsBlob = false,
    isUpload = false,
    httpParams: params,
  }: PerformRequestParams): Promise<T> {
    console.log(`HttpWrapperService ${method}: ${url}`, body ?? '');

    try {
      const response = await lastValueFrom<Error | HttpErrorResponse | T>(
        this.http
          .request(method, url, {
            headers: this.createHeaders(isUpload),
            responseType: responseAsBlob ? 'blob' : undefined,
            withCredentials: true,
            params: new HttpParams({ fromObject: params }),
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
            catchError((error: HttpErrorResponse) => this.handleError(error)),
          ),
      );

      if (response instanceof Error || response instanceof HttpErrorResponse) {
        // eslint-disable-next-line @typescript-eslint/only-throw-error -- we're ok with throwing HttpErrorResponse
        throw response;
      }

      return response;
    } catch (error) {
      console.error(`Error in HttpWrapperService ${method}:`, error);
      throw error;
    }
  }

  public async perform121ServiceRequest<T>(
    options: Perform121ServiceRequestParams,
  ): Promise<T> {
    return this.performRequest<T>({
      ...options,
      url: `${environment.url_121_service_api}/${options.endpoint}`,
    });
  }
}
